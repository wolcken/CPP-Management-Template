// src/services/productos.ts
import { db } from "../lib/firebase";
import {
    collection, deleteDoc, doc, getDoc, getDocs, onSnapshot,
    orderBy, query, serverTimestamp, updateDoc, where, type Unsubscribe,
    runTransaction
} from "firebase/firestore";
import type { Producto, ProductoInput } from "./types";

const COL = "productos";
const colRef = collection(db, COL);
const norm = (s: string) => (s || "").trim().toLowerCase();

/** ========= Suscripción ========= */

/** Suscripción a productos (ordenados por nombre) */
export function subscribeProductos(cb: (rows: Producto[]) => void): Unsubscribe {
    const q = query(colRef, orderBy("nombre"));
    return onSnapshot(q, (snap) => {
        const rows: Producto[] = snap.docs.map((d) => {
            const data = d.data() as Omit<Producto, "id">;
            return { id: d.id, ...data };
        });
        cb(rows);
    });
}

/** Obtener un producto por id */
export async function getProductoById(id: string): Promise<Producto> {
    const ref = doc(db, COL, id);
    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Producto no encontrado.");
    return { id: snap.id, ...(snap.data() as Omit<Producto, "id">) };
}

/** ========= Crear / Actualizar nominal ========= */

/** Validación / normalización de campos nominales (EXIGE SKU) */
function sanitizeProducto(p: ProductoInput): ProductoInput {
    const nombre = (p.nombre || "").trim();
    const sku = (p.sku || "").trim();

    if (!nombre) throw new Error("El nombre es obligatorio.");
    if (!sku) throw new Error("El SKU es obligatorio.");
    if (!p.marcaId) throw new Error("Selecciona una marca.");
    if (!p.categoriaId) throw new Error("Selecciona una categoría.");
    if (!p.proveedorId) throw new Error("Selecciona un proveedor.");

    const unidad = (p.unidad || "").trim() || undefined;

    return {
        nombre,
        sku,
        marcaId: p.marcaId,
        categoriaId: p.categoriaId,
        proveedorId: p.proveedorId,
        unidad,
    };
}

/** Versión sin SKU (para creación con SKU automático) */
function sanitizeProductoWithoutSku(p: Omit<ProductoInput, "sku">): Omit<ProductoInput, "sku"> {
    const nombre = (p.nombre || "").trim();
    if (!nombre) throw new Error("El nombre es obligatorio.");
    if (!p.marcaId) throw new Error("Selecciona una marca.");
    if (!p.categoriaId) throw new Error("Selecciona una categoría.");
    if (!p.proveedorId) throw new Error("Selecciona un proveedor.");
    const unidad = (p.unidad || "").trim() || undefined;
    return {
        nombre,
        marcaId: p.marcaId,
        categoriaId: p.categoriaId,
        proveedorId: p.proveedorId,
        unidad,
    };
}

/**
 * Crear producto con SKU automático por CATEGORÍA: PREFIJO + secuencia.
 * - Prefijo se obtiene del nombre de la categoría (normalizePrefix)
 * - Contador por prefijo: meta/counters → { skuSeqs: { PREFIJO: N } }
 * - Formato: PREFIJO-0001, PREFIJO-0002, ...
 */
export async function createProductoAutoSkuPorCategoria(
    input: Omit<ProductoInput, "sku">
): Promise<{ id: string; sku: string }> {
    const sanitized = sanitizeProductoWithoutSku(input);

    const res = await runTransaction(db, async (tx) => {
        // 1) Leer categoría para armar el prefijo
        const catRef = doc(db, "categorias", sanitized.categoriaId);
        const catSnap = await tx.get(catRef);
        const catNombre = catSnap.exists() ? ((catSnap.data() as any).nombre || "PRD") : "PRD";
        const prefix = normalizePrefix(catNombre) || "PRD";

        // 2) Leer/actualizar contador por prefijo
        const countersRef = doc(db, "meta", "counters");
        const countersSnap = await tx.get(countersRef);
        const data = countersSnap.exists() ? (countersSnap.data() as any) : {};
        const seqs = data.skuSeqs || {};
        const last = Number(seqs[prefix] || 0);
        const next = last + 1;

        // Escribir el nuevo valor del prefijo (merge)
        tx.set(countersRef, { skuSeqs: { [prefix]: next } }, { merge: true });

        // 3) Construir el SKU
        const sku = `${prefix}-${String(next).padStart(4, "0")}`;

        // 4) Crear el producto
        const newDoc = doc(colRef);
        tx.set(newDoc, {
            ...sanitized,
            sku,
            sku_lc: norm(sku),
            nombre_lc: norm(sanitized.nombre),
            stock: 0,
            cpp: 0,
            valorizado: 0,
            createdAt: serverTimestamp(),
        });

        return { id: newDoc.id, sku };
    });

    return res;
}

/** Normaliza nombre → PREFIJO (hasta 4 chars, sin tildes ni símbolos) */
function normalizePrefix(s: string): string {
    return (s || "PRD")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quitar acentos
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "") // solo A-Z 0-9
        .slice(0, 4) || "PRD";
}

/**
 * Actualizar producto nominal (NO cambia SKU aquí).
 * Si necesitas cambiar SKU, crea una función separada con verificación de unicidad.
 */
export async function updateProducto(id: string, patch: Partial<ProductoInput>): Promise<void> {
    const ref = doc(db, COL, id);
    const current = await getDoc(ref);
    if (!current.exists()) throw new Error("Producto no encontrado.");

    // Evitar cambios de SKU aquí (por políticas de negocio)
    if (typeof patch.sku === "string" && patch.sku.trim() !== "") {
        // Ignoramos SKU en este método para no romper unicidad sin control
        const { sku, ...rest } = patch as any;
        patch = rest;
    }

    // Re-componer y sanear con los valores existentes
    const mergedInput = {
        ...(current.data() as ProductoInput),
        ...patch,
    };
    const sanitized = sanitizeProducto(mergedInput);

    await updateDoc(ref, {
        ...sanitized,
        nombre_lc: norm(sanitized.nombre),
        updatedAt: serverTimestamp(),
    });
}

/** (Opcional) Cambiar SKU con unicidad */
export async function updateProductoSKU(id: string, nuevoSKU: string): Promise<void> {
    const sku = (nuevoSKU || "").trim();
    if (!sku) throw new Error("El SKU es obligatorio.");

    const ref = doc(db, COL, id);
    const current = await getDoc(ref);
    if (!current.exists()) throw new Error("Producto no encontrado.");

    // Verificar unicidad case-insensitive
    const existsQ = query(colRef, where("sku_lc", "==", norm(sku)));
    const exists = await getDocs(existsQ);
    if (!exists.empty && exists.docs.some((d) => d.id !== id)) {
        throw new Error("Ya existe otro producto con ese SKU.");
    }

    await updateDoc(ref, {
        sku,
        sku_lc: norm(sku),
        updatedAt: serverTimestamp(),
    });
}

/** Eliminar producto */
export async function deleteProducto(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}

/** ========= Inventario (denormalizado) ========= */

/**
 * Actualiza EXCLUSIVAMENTE campos de inventario denormalizados.
 * Úsalo para backfill o para reflejar cambios luego de Entradas/Salidas.
 */
export async function updateProductoInventario(
    id: string,
    data: Partial<{ stock: number; cpp: number; valorizado: number }>
): Promise<void> {
    const ref = doc(db, COL, id);

    const patch: any = {};
    if (typeof data.stock === "number") patch.stock = data.stock;
    if (typeof data.cpp === "number") {
        // 2 decimales
        patch.cpp = Math.round((data.cpp + Number.EPSILON) * 100) / 100;
    }
    if (typeof data.valorizado === "number") {
        patch.valorizado = Math.round((data.valorizado + Number.EPSILON) * 100) / 100;
    }
    patch.updatedAt = serverTimestamp();

    await updateDoc(ref, patch);
}
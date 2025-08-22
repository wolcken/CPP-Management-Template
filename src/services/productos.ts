// src/services/productos.ts
import { db } from "../lib/firebase";
import {
    addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot,
    orderBy, query, serverTimestamp, updateDoc, where, type Unsubscribe
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

/** Validación / normalización de campos nominales */
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
        activo: p.activo ?? true,
    };
}

/** Crear producto nominal (inicializa stock/cpp/valorizado en 0) */
export async function createProducto(input: ProductoInput): Promise<string> {
    const data = sanitizeProducto(input);

    // SKU único (case-insensitive)
    const existsQ = query(colRef, where("sku_lc", "==", norm(data.sku)));
    const exists = await getDocs(existsQ);
    if (!exists.empty) throw new Error("Ya existe un producto con ese SKU.");

    const docRef = await addDoc(colRef, {
        ...data,
        // denormalizado de búsqueda
        sku_lc: norm(data.sku),
        nombre_lc: norm(data.nombre),
        // inventario inicial
        stock: 0,
        cpp: 0,
        valorizado: 0,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
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
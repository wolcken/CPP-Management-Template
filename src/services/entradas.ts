import { db } from "../lib/firebase";
import {
    addDoc, collection, deleteDoc, doc, getDoc, getDocs, limit, limitToLast,
    orderBy, query, where, serverTimestamp, startAfter, endBefore,
    Timestamp
} from "firebase/firestore";
import type { Entrada, EntradaInput } from "./types";

const COL = "entradas";
const colRef = collection(db, COL);

// Configurable (IVA Bolivia 13%)
export const DEFAULT_IVA_RATE = 0.13;

// Convierte Date | "YYYY-MM-DD" a Timestamp
function toTimestamp(d: Date | string): Timestamp {
    if (d instanceof Date) return Timestamp.fromDate(d);
    // asume "YYYY-MM-DD"
    return Timestamp.fromDate(new Date(`${d}T00:00:00`));
}

// Calcula totales netos
function computeTotals(unidades: number, precioUnitario: number, ivaRate: number) {
    const precioTotal = +(unidades * precioUnitario).toFixed(2);
    const totalNeto = +(precioTotal / (1 + ivaRate)).toFixed(2);
    const costoUnitarioNeto = +(totalNeto / unidades).toFixed(4);
    return { precioTotal, totalNeto, costoUnitarioNeto };
}

/** Crear entrada (compra) */
export async function createEntrada(input: EntradaInput): Promise<string> {
    const unidades = Number(input.unidades);
    const precioUnitario = Number(input.precioUnitario);
    if (!input.productoId) throw new Error("Selecciona un producto.");
    if (!input.proveedorId) throw new Error("Selecciona un proveedor.");
    if (!unidades || unidades <= 0) throw new Error("Unidades inválidas.");
    if (!precioUnitario || precioUnitario <= 0) throw new Error("Precio unitario inválido.");

    const ivaRate = input.ivaRate ?? DEFAULT_IVA_RATE;

    // Denormalizar datos del producto (nombre, sku)
    const pSnap = await getDoc(doc(db, "productos", input.productoId));
    if (!pSnap.exists()) throw new Error("Producto no encontrado.");
    const pData = pSnap.data() as any;

    // Denormalizar datos del proveedor (nombre, nit)
    const provSnap = await getDoc(doc(db, "proveedores", input.proveedorId));
    if (!provSnap.exists()) throw new Error("Proveedor no encontrado.");
    const provData = provSnap.data() as any;

    const { precioTotal, totalNeto, costoUnitarioNeto } = computeTotals(unidades, precioUnitario, ivaRate);

    const payload = {
        productoId: input.productoId,
        productoNombre: pData?.nombre || undefined,
        productoSku: pData?.sku || undefined,
        proveedorId: input.proveedorId,
        proveedorNombre: provData?.nombre || undefined,
        proveedorNit: provData?.nit || undefined,
        fecha: toTimestamp(input.fecha),
        nroFactura: input.nroFactura,
        unidades,
        precioUnitario,
        precioTotal,
        totalNeto,
        costoUnitarioNeto,
        ivaRate,
        unidadMedida: input.unidadMedida,
        createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(colRef, payload);
    return docRef.id;
}

/** Eliminar una entrada */
export async function deleteEntrada(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}

// ---------- Paginación ----------

export type EntradasPage = {
    items: Entrada[];
    firstDoc: any | null;
    lastDoc: any | null;
};

const baseQuery = (pageSize: number) =>
    query(colRef, orderBy("fecha", "desc"), orderBy("createdAt", "desc"), limit(pageSize));

export async function getEntradasFirstPage(pageSize = 10): Promise<EntradasPage> {
    const q = baseQuery(pageSize);
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Entrada, "id">) }));
    return {
        items,
        firstDoc: snap.docs[0] || null,
        lastDoc: snap.docs[snap.docs.length - 1] || null,
    };
}

export async function getEntradasNextPage(pageSize: number, lastDoc: any): Promise<EntradasPage> {
    const q = query(colRef, orderBy("fecha", "desc"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Entrada, "id">) }));
    return {
        items,
        firstDoc: snap.docs[0] || null,
        lastDoc: snap.docs[snap.docs.length - 1] || null,
    };
}

export async function getEntradasPrevPage(pageSize: number, firstDoc: any): Promise<EntradasPage> {
    const q = query(colRef, orderBy("fecha", "desc"), orderBy("createdAt", "desc"), endBefore(firstDoc), limitToLast(pageSize));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Entrada, "id">) }));
    return {
        items,
        firstDoc: snap.docs[0] || null,
        lastDoc: snap.docs[snap.docs.length - 1] || null,
    };
}

// Entradas por producto (orden ascendente por fecha/createdAt)
export async function fetchEntradasByProducto(productoId: string): Promise<Entrada[]> {
    const q = query(
        colRef,
        where("productoId", "==", productoId),
        orderBy("fecha", "asc"),
        orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Entrada, "id">) }));
}
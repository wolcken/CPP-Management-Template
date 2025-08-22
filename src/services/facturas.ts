import { db } from "../lib/firebase";
import {
    collection, doc, runTransaction, serverTimestamp, Timestamp,
    getDocs, getDoc, query, orderBy, limit, startAfter, endBefore, limitToLast,
} from "firebase/firestore";
import type { Factura, FacturaInput } from "./types";

const COL = "facturas";
const colRef = collection(db, COL);

/** Convierte YYYY-MM-DD | Date a Timestamp */
function toTimestamp(d: string | Date): Timestamp {
    if (d instanceof Date) return Timestamp.fromDate(d);
    return Timestamp.fromDate(new Date(`${d}T00:00:00`));
}

/** Crea una factura + descuenta stock + genera salidas (todo atómico) */
export async function createFactura(input: FacturaInput): Promise<string> {
  if (!input.numero?.trim()) throw new Error("El número de factura es obligatorio.");
  if (!input.fecha) throw new Error("La fecha es obligatoria.");
  if (!input.items?.length) throw new Error("Agrega al menos un producto.");

  const payloadBase = {
    ...input,
    numero: input.numero.trim(),
    fecha: toTimestamp(input.fecha as any),
    subtotal: Number(input.subtotal.toFixed(2)),
    itemsProductoIds: input.items.map(i => i.productoId),
    createdAt: serverTimestamp(),
  };

  // helper: redondeo 2 decimales
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

  // 1) Agregar por producto la cantidad total solicitada (por si un mismo producto aparece en varias líneas)
  const totalesPorProducto = input.items.reduce<Record<string, number>>((acc, it) => {
    acc[it.productoId] = (acc[it.productoId] || 0) + it.cantidad;
    return acc;
  }, {});

  const facturaId = await runTransaction(db, async (tx) => {
    // 2) Leer productos involucrados y validar stock
    const productosCache: Record<string, { ref: ReturnType<typeof doc>, data: any }> = {};
    for (const pid of Object.keys(totalesPorProducto)) {
      const pRef = doc(db, "productos", pid);
      const pSnap = await tx.get(pRef);
      if (!pSnap.exists()) throw new Error(`Producto no encontrado (${pid})`);
      productosCache[pid] = { ref: pRef, data: pSnap.data() };
    }

    // 3) Descontar stock (CPP no cambia en salidas) y actualizar productos
    for (const [pid, cant] of Object.entries(totalesPorProducto)) {
      const { ref: pRef, data: p } = productosCache[pid];
      const prevStock = Number(p.stock ?? 0);
      const prevCpp   = Number(p.cpp ?? 0);
      if (cant > prevStock) {
        const nombre = p.nombre || pid;
        throw new Error(`Stock insuficiente para "${nombre}". Disponible: ${prevStock}, solicitado: ${cant}.`);
      }
      const stock = prevStock - cant;
      const cpp = round2(prevCpp);
      const valorizado = round2(stock * cpp);

      tx.update(pRef, {
        stock,
        cpp,             // no cambia en salidas
        valorizado,
        updatedAt: serverTimestamp(),
      });
    }

    // 4) Crear factura
    const factRef = doc(colRef); // en transacción no se usa addDoc
    tx.set(factRef, payloadBase);

    // 5) Crear documentos en `salidas` (uno por item)
    const salidasCol = collection(db, "salidas");
    for (const it of input.items) {
      const sRef = doc(salidasCol);
      tx.set(sRef, {
        facturaId: factRef.id,
        productoId: it.productoId,
        cantidad: it.cantidad,
        precioUnitario: it.precioUnitario, // venta (no afecta CPP)
        fecha: payloadBase.fecha,
        createdAt: serverTimestamp(),
      });
    }

    return factRef.id;
  });

  return facturaId;
}

/** Reserva el siguiente número con transacción */
export async function reserveNextFacturaNumber(padding = 6): Promise<string> {
    const counterRef = doc(db, "counters", "facturas");
    const next = await runTransaction(db, async (tx) => {
        const snap = await tx.get(counterRef);
        const current = (snap.exists() ? (snap.data() as any).next : 1) as number;
        tx.set(counterRef, { next: current + 1 }, { merge: true });
        return current;
    });
    return String(next).padStart(padding, "0");
}

/* ---------- Listado + paginación ---------- */

export type FacturasPage = {
    items: Factura[];
    firstDoc: any | null;
    lastDoc: any | null;
};

const baseQuery = (pageSize: number) =>
    query(colRef, orderBy("fecha", "desc"), orderBy("createdAt", "desc"), limit(pageSize));

export async function getFacturasFirstPage(pageSize = 10): Promise<FacturasPage> {
    const snap = await getDocs(baseQuery(pageSize));
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Factura, "id">) }));
    return { items, firstDoc: snap.docs[0] || null, lastDoc: snap.docs[snap.docs.length - 1] || null };
}

export async function getFacturasNextPage(pageSize: number, lastDoc: any): Promise<FacturasPage> {
    const q = query(colRef, orderBy("fecha", "desc"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(pageSize));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Factura, "id">) }));
    return { items, firstDoc: snap.docs[0] || null, lastDoc: snap.docs[snap.docs.length - 1] || null };
}

export async function getFacturasPrevPage(pageSize: number, firstDoc: any): Promise<FacturasPage> {
    const q = query(colRef, orderBy("fecha", "desc"), orderBy("createdAt", "desc"), endBefore(firstDoc), limitToLast(pageSize));
    const snap = await getDocs(q);
    const items = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Factura, "id">) }));
    return { items, firstDoc: snap.docs[0] || null, lastDoc: snap.docs[snap.docs.length - 1] || null };
}

/** Obtener una factura por id */
export async function getFacturaById(id: string): Promise<Factura> {
    const snap = await getDoc(doc(db, COL, id));
    if (!snap.exists()) throw new Error("Factura no encontrada.");
    return { id: snap.id, ...(snap.data() as Omit<Factura, "id">) };
}
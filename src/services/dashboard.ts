import { type CategoryPoint, type DashboardData, type MonthPoint, type ProductKpi, type TopProduct } from "../types/dashboard";
import { db } from "../lib/firebase";
import { collection, getDocs, orderBy, query, Timestamp, startAt, where, documentId } from "firebase/firestore";
import { getInventarioResumen } from "../services/inventario";

// Helpers
const fmtMonthLabel = (date: Date) =>
    date.toLocaleDateString("es-BO", { month: "short", year: "numeric" }).replace(".", "");
const startOfMonth = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, delta: number) => new Date(d.getFullYear(), d.getMonth() + delta, 1);
const monthKey = (d: Date) => fmtMonthLabel(startOfMonth(d));
const tsFromDate = (d: Date) => Timestamp.fromDate(d);
const toDate = (x: any) => (x?.toDate ? x.toDate() : new Date(x));

// Tipos
type SalidaDoc = {
    id: string;
    productoId: string;
    facturaId: string;
    cantidad: number;
    precioUnitario: number;
    fecha: any;
    createdAt?: any;
};
type EntradaDoc = {
    id: string;
    productoId: string;
    unidades: number;
    precioUnitario?: number;
    fecha: any;
    createdAt?: any;
};

// Queries
async function fetchSalidasRange(start: Date): Promise<SalidaDoc[]> {
    const qy = query(
        collection(db, "salidas"),
        orderBy("fecha", "asc"),     // ✅ un solo orderBy → índice de campo único
        startAt(tsFromDate(start))   // ✅ rango en el mismo campo
    );
    const snap = await getDocs(qy);

    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SalidaDoc, "id">) }));
    // Orden estable secundario por createdAt en memoria
    rows.sort((a, b) => {
        const fa = +toDate(a.fecha);
        const fb = +toDate(b.fecha);
        if (fa !== fb) return fa - fb;
        const ca = a.createdAt ? +toDate(a.createdAt) : 0;
        const cb = b.createdAt ? +toDate(b.createdAt) : 0;
        return ca - cb;
    });
    return rows;
}

async function fetchEntradasRange(start: Date): Promise<EntradaDoc[]> {
    const qy = query(
        collection(db, "entradas"),
        orderBy("fecha", "asc"),
        startAt(tsFromDate(start))
    );
    const snap = await getDocs(qy);

    const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<EntradaDoc, "id">) }));
    rows.sort((a, b) => {
        const fa = +toDate(a.fecha);
        const fb = +toDate(b.fecha);
        if (fa !== fb) return fa - fb;
        const ca = a.createdAt ? +toDate(a.createdAt) : 0;
        const cb = b.createdAt ? +toDate(b.createdAt) : 0;
        return ca - cb;
    });
    return rows;
}

// Labels
function buildMonthLabels(months: number): string[] {
    const end = startOfMonth(new Date());
    const start = addMonths(end, -months + 1);
    const labels: string[] = [];
    for (let d = new Date(start); d <= end; d = addMonths(d, 1)) labels.push(fmtMonthLabel(d));
    return labels;
}

// === Resolución de etiquetas (nombre / SKU) para IDs de productos ===
type ProductoMeta = { nombre?: string; sku?: string };
const labelFor = (id: string, meta?: ProductoMeta) =>
    meta?.sku || meta?.nombre || id;

/** Obtiene {id → {nombre, sku}} desde la colección 'productos' (máx. 10 ids por IN). */
async function fetchProductosMeta(ids: string[]): Promise<Record<string, ProductoMeta>> {
    const meta: Record<string, ProductoMeta> = {};
    const uniq = Array.from(new Set(ids));
    if (!uniq.length) return meta;

    // Como solo pedimos Top 5, un único IN alcanza.
    const qy = query(
        collection(db, "productos"),
        // @ts-ignore: documentId() a veces no está bien tipado en los d.ts
        where(documentId(), "in", uniq as string[])
    );
    const snap = await getDocs(qy);
    for (const d of snap.docs) {
        const data = d.data() as any;
        meta[d.id] = {
            nombre: data?.nombre ?? data?.name ?? data?.titulo,
            sku: data?.sku ?? data?.codigo ?? data?.code,
        };
    }
    return meta;
}

// Principal
export async function fetchDashboardData(months = 12): Promise<DashboardData> {
    const end = startOfMonth(new Date());
    const start = addMonths(end, -months + 1);
    const labels = buildMonthLabels(months);

    const [salidas, entradas] = await Promise.all([
        fetchSalidasRange(start),
        fetchEntradasRange(start).catch(() => []),
    ]);

    const monthlyMap = new Map<string, { facturas: number; ingresos: number; _set: Set<string> }>();
    const stackedMap = new Map<string, { Entradas: number; Salidas: number }>();
    const topMap = new Map<string, { cantidad: number; ingresos: number }>(); // key: productoId

    for (const l of labels) {
        monthlyMap.set(l, { facturas: 0, ingresos: 0, _set: new Set() });
        stackedMap.set(l, { Entradas: 0, Salidas: 0 });
    }

    // Salidas
    for (const s of salidas) {
        const fDate = toDate(s.fecha);
        const mk = monthKey(fDate);
        if (!monthlyMap.has(mk)) continue;

        const m = monthlyMap.get(mk)!;
        m._set.add(s.facturaId);
        m.ingresos += (s.cantidad || 0) * (s.precioUnitario || 0);

        stackedMap.get(mk)!.Salidas += s.cantidad || 0;

        const prev = topMap.get(s.productoId) || { cantidad: 0, ingresos: 0 };
        prev.cantidad += s.cantidad || 0;
        prev.ingresos += (s.cantidad || 0) * (s.precioUnitario || 0);
        topMap.set(s.productoId, prev);
    }

    // Entradas
    for (const e of entradas) {
        const eDate = toDate(e.fecha);
        const mk = monthKey(eDate);
        if (stackedMap.has(mk)) stackedMap.get(mk)!.Entradas += e.unidades || 0;
    }

    // Monthly
    const monthly: MonthPoint[] = labels.map((mes) => {
        const row = monthlyMap.get(mes)!;
        return { mes, facturas: row._set.size, ingresos: Math.round(row.ingresos) };
    });

    // Top 5 (IDs)
    const topEntries = Array.from(topMap.entries())
        .sort((a, b) => b[1].cantidad - a[1].cantidad)
        .slice(0, 5);
    const topIds = topEntries.map(([id]) => id);

    // Meta (nombre/sku) para esos IDs
    const metaMap = await fetchProductosMeta(topIds);

    // Stacked
    const stacked: CategoryPoint[] = labels.map((mes) => ({ mes, ...stackedMap.get(mes)! }));

    // KPIs por producto (usa ID real, etiqueta legible)
    const productKpis: ProductKpi[] = [];
    for (const id of topIds) {
        const meta = metaMap[id];
        try {
            const res = await getInventarioResumen(id, { forceRecalc: false, persist: false } as any);
            productKpis.push({
                id,
                nombre: labelFor(id, meta),
                stock: Number((res as any)?.stock || 0),
                cpp: Number((res as any)?.cpp || 0),
                ultimaSalida: (res as any)?.ultimaSalida,
            });
        } catch {
            productKpis.push({ id, nombre: labelFor(id, meta), stock: 0, cpp: 0 });
        }
    }

    // Top 5 (con etiqueta legible)
    const top: TopProduct[] = topEntries.map(([id, v]) => ({
        producto: labelFor(id, metaMap[id]),
        cantidad: v.cantidad,
        ingresos: Math.round(v.ingresos),
    }));

    return { monthly, top, stacked, productKpis };
}
// src/services/inventario.ts
import { db } from "../lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { fetchEntradasByProducto } from "./entradas";
import { fetchSalidasByProducto } from "./salidas";

export type KardexRow = {
    fecha: any;
    concepto: string;
    entradaUnidades?: number;
    entradaTotal?: number;       // neto de compra
    salidaUnidades?: number;
    salidaTotal?: number;        // costo de salida (CPP * unidades)
    saldoUnidades: number;
    cpp: number;                 // CPP vigente tras el movimiento
    saldoTotal: number;          // saldoUnidades * cpp
    meta?: { tipo: "E" | "S"; ref?: string };
};

export type KardexResult = {
    rows: KardexRow[];
    resumen: { stock: number; cpp: number; valorizado: number };
};

// helpers
const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
const round4 = (n: number) => Math.round((n + Number.EPSILON) * 10000) / 10000;
const toMillis = (d: any) => (d?.toMillis ? d.toMillis() : +new Date(d || 0));

export async function getKardexCPP(productoId: string): Promise<KardexResult> {
    const [entradas, salidas] = await Promise.all([
        fetchEntradasByProducto(productoId),
        fetchSalidasByProducto(productoId),
    ]);

    type Move =
        | { tipo: "E"; fecha: any; createdAt?: any; unidades: number; total: number; concepto: string }
        | { tipo: "S"; fecha: any; createdAt?: any; unidades: number; concepto: string; ref?: string };

    // Fallbacks por si alguna entrada no trae totalNeto
    const moves: Move[] = [
        ...entradas.map((e: any) => {
            const totalNeto =
                typeof e.totalNeto === "number"
                    ? e.totalNeto
                    : typeof e.costoUnit === "number"
                        ? round2((e.unidades || 0) * e.costoUnit)
                        : 0;
            return {
                tipo: "E" as const,
                fecha: e.fecha,
                createdAt: e.createdAt,
                unidades: Number(e.unidades || 0),
                total: totalNeto,
                concepto: e.concepto || e.proveedor || "Compra de materiales",
            };
        }),
        ...salidas.map((s: any) => ({
            tipo: "S" as const,
            fecha: s.fecha,
            createdAt: s.createdAt,
            unidades: Number(s.cantidad || 0),
            concepto: s.concepto || s.cliente || "Salida a ventas",
            ref: s.facturaId,
        })),
    ];

    // Orden estable: fecha asc, luego createdAt asc
    moves.sort((a, b) => {
        const ta = toMillis(a.fecha);
        const tb = toMillis(b.fecha);
        if (ta !== tb) return ta - tb;
        return toMillis(a.createdAt) - toMillis(b.createdAt);
    });

    // Recorrido CPP
    let saldoU = 0;
    let cpp = 0;          // vigente
    let saldoTotal = 0;   // saldoU * cpp
    const rows: KardexRow[] = [];

    for (const m of moves) {
        if (m.tipo === "E") {
            const nuevoSaldoU = saldoU + m.unidades;
            const nuevoSaldoTotal = round2(saldoTotal + m.total);
            const nuevoCPP = nuevoSaldoU > 0 ? round4(nuevoSaldoTotal / nuevoSaldoU) : 0;

            saldoU = nuevoSaldoU;
            cpp = nuevoCPP;
            saldoTotal = round2(saldoU * cpp);

            rows.push({
                fecha: m.fecha,
                concepto: m.concepto,
                entradaUnidades: m.unidades,
                entradaTotal: m.total,
                saldoUnidades: saldoU,
                cpp,
                saldoTotal,
                meta: { tipo: "E" },
            });
        } else {
            // Salida al costo: costo = cpp vigente * unidades
            const salidaTotal = round2(cpp * m.unidades);
            const nuevoSaldoU = saldoU - m.unidades;
            saldoU = nuevoSaldoU;          // cpp se mantiene
            saldoTotal = round2(cpp * nuevoSaldoU);

            rows.push({
                fecha: m.fecha,
                concepto: m.concepto,
                salidaUnidades: m.unidades,
                salidaTotal,
                saldoUnidades: saldoU,
                cpp,
                saldoTotal,
                meta: { tipo: "S", ref: m.ref },
            });
        }
    }

    return {
        rows,
        resumen: { stock: saldoU, cpp, valorizado: saldoTotal },
    };
}

/**
 * Resumen (stock, cpp, valorizado).
 * - Por defecto usa lo denormalizado en productos/{id} si existe.
 * - Si `forceRecalc` = true, recalcula desde Kárdex y (por defecto) persiste en productos/{id}.
 */
export async function getInventarioResumen(
    productoId: string,
    opts?: { forceRecalc?: boolean; persist?: boolean }
): Promise<{ stock: number; cpp: number; valorizado: number }> {
    const force = !!opts?.forceRecalc;
    const persist = opts?.persist !== false; // default: true

    const pRef = doc(db, "productos", productoId);

    if (!force) {
        const snap = await getDoc(pRef);
        if (!snap.exists()) throw new Error("Producto no encontrado");
        const p = snap.data() as any;
        const hasDenorm =
            typeof p?.stock === "number" &&
            typeof p?.cpp === "number" &&
            typeof p?.valorizado === "number";

        if (hasDenorm) {
            return {
                stock: Number(p.stock || 0),
                cpp: round2(Number(p.cpp || 0)),
                valorizado: round2(Number(p.valorizado || 0)),
            };
        }
    }

    // Recalcular desde kárdex y (opcional) guardar en productos
    const { resumen } = await getKardexCPP(productoId);
    const res = {
        stock: Number(resumen.stock || 0),
        cpp: round2(Number(resumen.cpp || 0)),
        valorizado: round2(Number(resumen.valorizado || 0)),
    };

    if (persist) {
        try {
            await updateDoc(pRef, { ...res, updatedAt: serverTimestamp() });
        } catch {
            /* ignore */
        }
    }

    return res;
}
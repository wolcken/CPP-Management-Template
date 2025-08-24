import { exportTablePdf } from "./exportTablePdf"; // ajusta la ruta si tu archivo está en otro lugar
import type { KardexResult } from "../../services/inventario";

const BOB = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });
const fmtDate = (ts: any) => {
    try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString("es-BO"); }
    catch { return "—"; }
};

const slug = (s: string) =>
    s.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ().-]/g, "").trim().replace(/\s+/g, "_");

type ExtraOpts = {
    logoDataUrl?: string; // base64 opcional (PNG/JPG)
    empresa?: string;     // opcional
    ruc?: string;         // opcional (NIT/RUC)
};

export function exportKardexPdf(
    productoNombre: string,
    resultado: KardexResult,
    extra: ExtraOpts = {}
) {
    // Definición de columnas planas (encabezado de 2 filas del UI lo "aplanamos" para PDF)
    const columns = [
        { header: "Fecha", dataKey: "fecha" },
        { header: "Concepto", dataKey: "concepto" },
        { header: "U. Entradas", dataKey: "entradaUnidades" },
        { header: "U. Salidas", dataKey: "salidaUnidades" },
        { header: "U. Saldo", dataKey: "saldoUnidades" },
        { header: "CPP", dataKey: "cpp" },
        { header: "I. Entradas", dataKey: "entradaTotal" },
        { header: "I. Salidas", dataKey: "salidaTotal" },
        { header: "I. Saldo", dataKey: "saldoTotal" },
    ];

    // Filas (respetando los "—" cuando no hay movimiento)
    const rows = (resultado.rows ?? []).map((r) => ({
        fecha: fmtDate(r.fecha),
        concepto: r.concepto || "",
        entradaUnidades: r.entradaUnidades ? `${r.entradaUnidades}` : "—",
        salidaUnidades: r.salidaUnidades ? `${r.salidaUnidades}` : "—",
        saldoUnidades: r.saldoUnidades,
        cpp: r.cpp, // lo formatea exportTablePdf si figura en currencyFields
        entradaTotal: r.entradaUnidades ? (r.entradaTotal || 0) : "—",
        salidaTotal: r.salidaUnidades ? (r.salidaTotal || 0) : "—",
        saldoTotal: r.saldoTotal,
    }));

    const filtersSummary = [
        `Producto: ${productoNombre}`,
        `Stock actual: ${resultado.resumen.stock}`,
        `CPP: ${BOB.format(resultado.resumen.cpp)}`,
        `Valorizado: ${BOB.format(resultado.resumen.valorizado)}`,
        ...(extra.empresa ? [`Entidad: ${extra.empresa}${extra.ruc ? ` — NIT: ${extra.ruc}` : ""}`] : []),
    ];

    exportTablePdf({
        title: `Kárdex · ${productoNombre}`,
        subtitle: extra.empresa ? `${extra.empresa}${extra.ruc ? ` — NIT: ${extra.ruc}` : ""}` : undefined,
        columns,
        rows,
        fileName: `Kardex_${slug(productoNombre)}`,
        orientation: "l",
        filtersSummary,
        currencyFields: ["cpp", "entradaTotal", "salidaTotal", "saldoTotal"],
    });
}
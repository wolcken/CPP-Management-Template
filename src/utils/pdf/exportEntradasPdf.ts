import { exportTablePdf } from "./exportTablePdf";

const fmtDate = (ts: any) => {
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("es-BO");
    } catch { return "—"; }
};

type EntradaRow = {
    fecha: any;
    productoNombre?: string;
    productoSku?: string;
    unidades: number;
    precioUnitario: number;     // bruto
    precioTotal: number;        // bruto
    totalNeto: number;          // neto
    costoUnitarioNeto: number;  // neto
};

export function exportEntradasPdf(rows: EntradaRow[], options?: {
    fileName?: string;
    subtitle?: string;
    filtros?: string[];
}) {
    const columns = [
        { header: "Fecha", dataKey: "fecha" },
        { header: "Producto", dataKey: "producto" },
        { header: "Unidades", dataKey: "unidades" },
        { header: "Precio unit. (bruto)", dataKey: "precioUnitario" },
        { header: "Precio total (bruto)", dataKey: "precioTotal" },
        { header: "Total neto", dataKey: "totalNeto" },
        { header: "Costo unit. neto", dataKey: "costoUnitarioNeto" },
    ];

    const mapped = rows.map(r => ({
        fecha: fmtDate(r.fecha),
        producto: r.productoNombre
            ? (r.productoSku ? `${r.productoNombre} · ${r.productoSku}` : r.productoNombre)
            : "—",
        unidades: r.unidades,
        precioUnitario: r.precioUnitario ?? 0,
        precioTotal: r.precioTotal ?? 0,
        totalNeto: r.totalNeto ?? 0,
        costoUnitarioNeto: r.costoUnitarioNeto ?? 0,
    }));

    const totalBruto = mapped.reduce((a, b) => a + (Number(b.precioTotal) || 0), 0);
    const totalNeto = mapped.reduce((a, b) => a + (Number(b.totalNeto) || 0), 0);

    exportTablePdf({
        title: "Entradas (compras)",
        subtitle: options?.subtitle,
        columns,
        rows: mapped,
        fileName: options?.fileName || "entradas",
        orientation: "l",
        filtersSummary: [
            ...(options?.filtros || []),
            `Registros: ${mapped.length}`,
            `Importe total bruto: ${totalBruto}`,
            `Importe total neto: ${totalNeto}`,
        ],
        currencyFields: ["precioUnitario", "precioTotal", "totalNeto", "costoUnitarioNeto"],
    });
}
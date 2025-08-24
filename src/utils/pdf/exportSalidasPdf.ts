import { exportTablePdf } from "./exportTablePdf";

const fmtDate = (ts: any) => {
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("es-BO");
    } catch { return "—"; }
};

type FacturaRow = {
    numero?: string | number;
    fecha: any;
    clienteNombre?: string;
    items?: Array<any>;
    subtotal: number;
};

export function exportSalidasPdf(rows: FacturaRow[], options?: {
    fileName?: string;
    subtitle?: string;
    filtros?: string[];
}) {
    const columns = [
        { header: "No.", dataKey: "numero" },
        { header: "Fecha", dataKey: "fecha" },
        { header: "Cliente", dataKey: "clienteNombre" },
        { header: "Items", dataKey: "itemsCount" },
        { header: "Subtotal", dataKey: "subtotal" },
    ];

    const mapped = rows.map(r => ({
        numero: r.numero ?? "—",
        fecha: fmtDate(r.fecha),
        clienteNombre: r.clienteNombre ?? "—",
        itemsCount: r.items?.length ?? 0,
        subtotal: r.subtotal ?? 0,
    }));

    const totalSubtotal = mapped.reduce((a, b) => a + (Number(b.subtotal) || 0), 0);

    exportTablePdf({
        title: "Salidas (facturas)",
        subtitle: options?.subtitle,
        columns,
        rows: mapped,
        fileName: options?.fileName || "salidas",
        orientation: "l",
        filtersSummary: [
            ...(options?.filtros || []),
            `Registros: ${mapped.length}`,
            `Subtotal total: ${totalSubtotal}`,
        ],
        currencyFields: ["subtotal"],
    });
}
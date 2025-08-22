import { exportTablePdf } from "./exportTablePdf";

const fmtDate = (ts: any) => {
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("es-BO");
    } catch {
        return "—";
    }
};

type EntradaRow = {
    // existentes
    fecha: any;
    productoNombre?: string;
    productoSku?: string;
    unidades: number;
    precioUnitario: number;     // bruto
    precioTotal?: number;       // bruto (compat)
    totalNeto: number;          // neto
    costoUnitarioNeto: number;  // neto
    // nuevos / opcionales
    proveedorNombre?: string;
    proveedorNit?: string;
    nroFactura?: string;
    unidadMedida?: string;      // UM: ML, KG, UN, etc.
    descripcionExtra?: string;
    subtotal?: number;          // bruto sin descuento
    descuentoPct?: number;      // %
    totalOperacion?: number;    // bruto - descuento
};

export function exportEntradasPdf(
    rows: EntradaRow[],
    options?: {
        fileName?: string;
        subtitle?: string;
        filtros?: string[];
    }
) {
    const columns = [
        { header: "Fecha", dataKey: "fecha" },
        { header: "Proveedor", dataKey: "proveedor" },
        { header: "NIT", dataKey: "nit" },
        { header: "N° Fact.", dataKey: "nroFactura" },
        { header: "Producto", dataKey: "producto" },
        { header: "UM", dataKey: "unidadMedida" },
        { header: "Cant.", dataKey: "unidades" },
        { header: "P.Unit (bruto)", dataKey: "precioUnitario" },
        { header: "Subtotal", dataKey: "subtotal" },
        { header: "Desc. (%)", dataKey: "descuentoPct" },
        { header: "Total operación", dataKey: "totalOperacion" },
        { header: "Total neto", dataKey: "totalNeto" },
        { header: "C.U. neto", dataKey: "costoUnitarioNeto" },
    ];

    const mapped = rows.map((r) => {
        // compat: si no viene subtotal, lo calculamos
        const subtotalCalc =
            typeof r.subtotal === "number"
                ? r.subtotal
                : +(Number(r.unidades || 0) * Number(r.precioUnitario || 0)).toFixed(2);

        const dPct = Math.min(100, Math.max(0, Number(r.descuentoPct || 0)));
        // compat: si no viene totalOperacion, usamos precioTotal (legacy) o calculamos con % desc.
        const totalOperacionCalc =
            typeof r.totalOperacion === "number"
                ? r.totalOperacion
                : typeof r.precioTotal === "number"
                    ? r.precioTotal
                    : +(subtotalCalc - (subtotalCalc * dPct) / 100).toFixed(2);

        const producto =
            (r.productoNombre || "—") +
            (r.productoSku ? ` · ${r.productoSku}` : "") +
            (r.descripcionExtra ? `\n${r.descripcionExtra}` : "");

        const proveedor =
            (r.proveedorNombre || "—");

        const nit =
            (r.proveedorNit || "—");

        return {
            fecha: fmtDate(r.fecha),
            proveedor,
            nit,
            nroFactura: r.nroFactura || "—",
            producto,
            unidadMedida: r.unidadMedida || "—",
            unidades: r.unidades ?? 0,
            precioUnitario: r.precioUnitario ?? 0,
            subtotal: subtotalCalc ?? 0,
            descuentoPct: typeof r.descuentoPct === "number" ? `${dPct}%` : "0%",
            totalOperacion: totalOperacionCalc ?? 0,
            totalNeto: r.totalNeto ?? 0,
            costoUnitarioNeto: r.costoUnitarioNeto ?? 0,
        };
    });

    const subtotalBruto = mapped.reduce((a, b) => a + (Number(b.subtotal) || 0), 0);
    const totalOperacion = mapped.reduce((a, b) => a + (Number(b.totalOperacion) || 0), 0);
    const totalNeto = mapped.reduce((a, b) => a + (Number(b.totalNeto) || 0), 0);
    const descuentoTotal = subtotalBruto - totalOperacion;

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
            `Subtotal bruto: ${subtotalBruto}`,
            `Descuento total: ${descuentoTotal}`,
            `Total operación (bruto): ${totalOperacion}`,
            `Importe total neto: ${totalNeto}`,
        ],
        // Los campos que deben formatearse como moneda
        currencyFields: [
            "precioUnitario",
            "subtotal",
            "totalOperacion",
            "totalNeto",
            "costoUnitarioNeto",
        ],
    });
}
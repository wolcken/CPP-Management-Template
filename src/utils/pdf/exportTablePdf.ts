import jsPDF from "jspdf";
import autoTable, { type RowInput, type UserOptions } from "jspdf-autotable";

// Formato de fecha/hora local (La Paz)
const fmtDateTime = () =>
    new Intl.DateTimeFormat("es-BO", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "America/La_Paz",
    }).format(new Date());

type ColumnDef = { header: string; dataKey: string };
type ExportOptions = {
    title: string;
    subtitle?: string;
    columns: ColumnDef[];
    rows: Array<Record<string, any>>;
    fileName?: string;           // sin .pdf
    orientation?: "p" | "l";     // portrait | landscape
    filtersSummary?: string[];   // líneas con filtros aplicados
    logoDataUrl?: string;        // opcional: logo en base64 (png o jpg)
    currencyFields?: string[];   // dataKeys que deben formatearse como moneda BOB
};

const BOB = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });

export function exportTablePdf(opts: ExportOptions) {
    const {
        title,
        subtitle,
        columns,
        rows,
        fileName = title.toLowerCase().replace(/\s+/g, "_"),
        orientation = "l",
        filtersSummary = [],
        logoDataUrl,
        currencyFields = [],
    } = opts;

    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let cursorY = 40;

    // Logo (opcional)
    if (logoDataUrl) {
        const logoW = 120;
        const logoH = 40;
        doc.addImage(logoDataUrl, "PNG", marginX, cursorY, logoW, logoH);
    }

    // Título centrado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(title, pageWidth / 2, cursorY + 16, { align: "center" });

    // Subtítulo / Fecha
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const sub = subtitle ? `${subtitle} — ${fmtDateTime()}` : fmtDateTime();
    doc.text(sub, pageWidth / 2, cursorY + 32, { align: "center" });

    // Filtros (si hay)
    if (filtersSummary.length) {
        let y = cursorY + 56;
        doc.setFontSize(9);
        filtersSummary.forEach((line) => {
            doc.text(`• ${line}`, marginX, y);
            y += 14;
        });
        cursorY = y - 4;
    } else {
        cursorY = cursorY + 48;
    }

    // Preparar columnas y filas
    const head = [columns.map((c) => c.header)];
    const body: RowInput[] = rows.map((r) =>
        columns.map((c) => {
            const val = r[c.dataKey];
            if (currencyFields.includes(c.dataKey) && typeof val === "number") {
                return BOB.format(val);
            }
            return val ?? "—";
        })
    );

    // Tabla
    autoTable(doc, {
        head,
        body,
        startY: cursorY,
        styles: { fontSize: 9, cellPadding: 6, valign: "middle" },
        headStyles: { fillColor: [33, 150, 243], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: marginX, right: marginX },
        didDrawPage: () => {
            // Pie de página con número de página
            const str = `Página ${doc.getNumberOfPages()}`;
            doc.setFontSize(9);
            doc.text(str, pageWidth - marginX, doc.internal.pageSize.getHeight() - 20, {
                align: "right",
            });
        },
    } as UserOptions);

    doc.save(`${fileName}.pdf`);
}
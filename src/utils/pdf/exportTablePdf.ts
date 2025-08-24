import jsPDF from "jspdf";
import autoTable, { type RowInput, type UserOptions } from "jspdf-autotable";
import { BRAND_BASE } from "../../theme/brands/base";

// Formato fecha/hora local (La Paz)
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
    fileName?: string;
    orientation?: "p" | "l";
    filtersSummary?: string[];
    currencyFields?: string[];
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
        currencyFields = [],
    } = opts;

    const doc = new jsPDF({ orientation, unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginX = 40;

    // === HEADER PROFESIONAL ===
    const drawHeader = () => {
        // Logo (si existe en public)
        const logoPath = BRAND_BASE.logoLight;
        if (logoPath) {
            try {
                doc.addImage(logoPath, "PNG", marginX, 20, 100, 40);
            } catch {
                // Si no se pudo cargar, no rompe
            }
        }

        // Nombre empresa
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text(BRAND_BASE.name, pageWidth / 2, 35, { align: "center" });

        // NIT (si hay)
        if (BRAND_BASE.nit) {
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`NIT: ${BRAND_BASE.nit}`, pageWidth / 2, 50, { align: "center" });
        }

        // Título header PDF
        if (BRAND_BASE.pdf?.headerTitle) {
            doc.setFont("helvetica", "bold");
            doc.setFontSize(12);
            doc.text(BRAND_BASE.pdf.headerTitle, pageWidth - marginX, 35, { align: "right" });
        }

        // Línea divisoria
        doc.setDrawColor(15, 61, 62); // --brand
        doc.setLineWidth(1);
        doc.line(marginX, 65, pageWidth - marginX, 65);
    };

    drawHeader();

    let cursorY = 80;

    // Subtítulo / Fecha
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const sub = subtitle ? `${subtitle} — ${fmtDateTime()}` : fmtDateTime();
    doc.text(sub, pageWidth / 2, cursorY, { align: "center" });
    cursorY += 20;

    // Filtros (si hay)
    if (filtersSummary.length) {
        doc.setFontSize(9);
        filtersSummary.forEach((line) => {
            doc.text(`• ${line}`, marginX, cursorY);
            cursorY += 14;
        });
    }

    // Preparar tabla
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

    // === Tabla con header y footer en cada página ===
    autoTable(doc, {
        head,
        body,
        startY: cursorY + 10,
        styles: { fontSize: 9, cellPadding: 6, valign: "middle" },
        headStyles: { fillColor: [15, 61, 62], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: marginX, right: marginX },
        didDrawPage: (data) => {
            drawHeader();

            // Footer
            if (BRAND_BASE.pdf?.footerText) {
                doc.setFontSize(9);
                doc.text(BRAND_BASE.pdf.footerText, marginX, pageHeight - 20);
            }
            const str = `Página ${data.pageNumber}`;
            doc.text(str, pageWidth - marginX, pageHeight - 20, { align: "right" });
        },
    } as UserOptions);

    doc.save(`${fileName}.pdf`);
}
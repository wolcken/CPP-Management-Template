import { BRAND } from "../../theme";

export const PdfBrand = {
    titleKardex: BRAND.pdf?.headerTitle ?? `KÁRDEX · ${BRAND.name}`,
    titleEntradas: `ENTRADAS · ${BRAND.name}`,
    titleSalidas: `FACTURAS · ${BRAND.name}`,
    footer: BRAND.pdf?.footerText ?? `${BRAND.name} · Bolivia`,
    currency: BRAND.ui?.currency ?? "BOB",
    ivaRate: BRAND.ui?.ivaRate ?? 0.13,
};
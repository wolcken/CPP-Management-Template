export type MonthPoint = {
    mes: string;        // ej: "ago 2025"
    facturas: number;   // cantidad
    ingresos: number;   // BOB
};

export type TopProduct = {
    producto: string;
    cantidad: number;
    ingresos?: number;
};

export type CategoryPoint = {
    mes: string;
    [categoria: string]: string | number;
};

export type ProductKpi = {
    id: string;
    nombre: string;
    stock: number;
    cpp: number;
    ultimaSalida?: string;
};

export type DashboardData = {
    monthly: MonthPoint[];
    top: TopProduct[];
    stacked: CategoryPoint[];
    productKpis: ProductKpi[];
};
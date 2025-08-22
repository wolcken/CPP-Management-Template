export type Marca = { id: string; nombre: string };
export type Categoria = { id: string; nombre: string };
export type Proveedor = {
    id: string;
    nombre: string;
    representante?: string;
    direccion?: string;
    telefono?: string;
};

export type Producto = {
    id: string;
    nombre: string;
    sku: string;
    marcaId: string;
    categoriaId: string;
    proveedorId: string;
    unidad?: string;   // p.ej. "unidad", "kg", "m"
    activo?: boolean;  // default: true
};

export type ProductoInput = Omit<Producto, "id">;

export type Entrada = {
    id: string;
    productoId: string;
    productoNombre?: string;
    productoSku?: string;
    fecha: any;               // Timestamp
    unidades: number;         // cantidad comprada
    precioUnitario: number;   // bruto
    precioTotal: number;      // bruto = unidades * precioUnitario
    totalNeto: number;        // sin IVA
    costoUnitarioNeto: number;// totalNeto / unidades
    ivaRate: number;          // p.ej. 0.13
    createdAt?: any;          // Timestamp
};

export type EntradaInput = {
    productoId: string;
    fecha: Date | string;     // "YYYY-MM-DD" o Date
    unidades: number;
    precioUnitario: number;   // bruto
    ivaRate?: number;         // default 0.13
};

export type FacturaItem = {
    productoId: string;
    nombre: string;
    sku?: string;
    unidad?: string;
    cantidad: number;
    precioUnitario: number; // venta
    total: number;          // cantidad * precioUnitario
};

export type Factura = {
    id: string;
    numero: string;         // No. Factura
    fecha: any;             // Timestamp
    clienteNombre?: string;
    clienteNIT?: string;
    items: FacturaItem[];
    subtotal: number;
    createdAt?: any;        // Timestamp
};

export type FacturaInput = Omit<Factura, "id" | "createdAt">;
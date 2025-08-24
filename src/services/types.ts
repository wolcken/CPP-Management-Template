export type Marca = { id: string; nombre: string };

export type Categoria = { id: string; nombre: string };

export type Proveedor = {
    id: string;
    nombre: string;
    nit: string;
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
};

export type ProductoInput = Omit<Producto, "id">;

export type Entrada = {
    id: string;

    // Producto
    productoId: string;
    productoNombre?: string;
    productoSku?: string;

    // Proveedor (desnormalizado)
    proveedorId: string;
    proveedorNombre?: string;
    proveedorNit?: string;

    // Documento
    fecha: any;                // Timestamp
    nroFactura?: string;

    // Detalle
    unidades: number;
    unidadMedida?: string;
    descripcionExtra?: string;

    // Precios
    precioUnitario: number;    // bruto
    subtotal: number;          // bruto = unidades * precioUnitario
    descuentoPct?: number;
    descuentoMonto?: number;
    totalOperacion: number;    // bruto - desc
    precioTotal?: number;      // alias de totalOperacion

    // Neto
    ivaRate: number;
    totalNeto: number;
    costoUnitarioNeto: number;

    createdAt?: any;
};

export type EntradaInput = {
    productoId: string;
    proveedorId: string;
    fecha: Date | string;     // "YYYY-MM-DD" o Date
    unidades: number;
    precioUnitario: number;   // bruto
    ivaRate?: number;         // default 0.13
    nroFactura?: string;
    unidadMedida?: string;
    descripcionExtra?: string;
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
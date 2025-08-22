import React, { useMemo, useState } from "react";
import type { Proveedor, Producto, EntradaInput } from "../../services/types";
import { DEFAULT_IVA_RATE } from "../../services/entradas";

type Props = {
    productos: Producto[];
    proveedores: Proveedor[];
    onSubmit: (data: EntradaInput) => void;
    submitText?: string;
    ivaDefault?: number; // opcional
};

// Opcional: catálogo de UM más comunes
const UM_OPTS = ["UN", "ML", "M2", "M3", "KG", "CJ", "PAQ", "LT"];

const EntradaForm: React.FC<Props> = ({
    productos,
    proveedores,
    onSubmit,
    submitText = "Guardar",
    ivaDefault = DEFAULT_IVA_RATE,
}) => {
    // proveedor
    const [proveedorId, setProveedorId] = useState<string>("");
    const proveedorSel = useMemo(
        () => proveedores.find(p => p.id === proveedorId) || null,
        [proveedores, proveedorId]
    );

    // cabecera
    const [nroFactura, setNroFactura] = useState<string>("");
    const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));

    // producto
    const [productoId, setProductoId] = useState("");
    const [unidadMedida, setUnidadMedida] = useState<string>("UN");
    const [descripcionExtra, setDescripcionExtra] = useState<string>("");

    // montos
    const [unidades, setUnidades] = useState<number | string>("");
    const [precioUnitario, setPrecioUnitario] = useState<number | string>("");
    const [descuentoPct, setDescuentoPct] = useState<number | string>(0);
    const [ivaRate, setIvaRate] = useState<number | string>(ivaDefault);

    const [error, setError] = useState("");

    // cálculos
    const calc = useMemo(() => {
        const u = Number(unidades) || 0;
        const pu = Number(precioUnitario) || 0;
        const iva = Number(ivaRate) || 0;
        const dPct = Math.min(100, Math.max(0, Number(descuentoPct) || 0));

        const subtotal = +(u * pu).toFixed(2);
        const descuentoMonto = +((subtotal * dPct) / 100).toFixed(2);
        const totalOperacion = +(Math.max(0, subtotal - descuentoMonto)).toFixed(2);
        // const totalNeto = iva >= 0 ? +(totalOperacion / (1 + iva)).toFixed(2) : 0;                   //Neto
        const totalNeto = iva >= 0 ? +(totalOperacion - (totalOperacion * iva)).toFixed(2) : 0;      //Bruto
        const costoUnitarioNeto = u > 0 ? +(totalNeto / u).toFixed(4) : 0;

        return { subtotal, descuentoMonto, totalOperacion, totalNeto, costoUnitarioNeto };
    }, [unidades, precioUnitario, ivaRate, descuentoPct]);

    const canSubmit = useMemo(() => {
        const u = Number(unidades);
        const pu = Number(precioUnitario);
        const iva = Number(ivaRate);
        return !!proveedorId && !!productoId && !!fecha && u > 0 && pu > 0 && iva >= 0;
    }, [proveedorId, productoId, fecha, unidades, precioUnitario, ivaRate]);

    return (
        <form
            className="form"
            onSubmit={(e) => {
                e.preventDefault();
                setError("");
                try {
                    onSubmit({
                        // proveedor (desnormalizado)
                        proveedorId,
                        proveedorNombre: proveedorSel?.nombre || "",
                        proveedorNit: proveedorSel?.nit || "",

                        // cabecera
                        nroFactura: nroFactura?.trim() || undefined,
                        fecha,

                        // base
                        productoId,
                        unidades: Number(unidades),
                        precioUnitario: Number(precioUnitario), // BRUTO
                        ivaRate: Number(ivaRate),

                        // extras
                        unidadMedida: unidadMedida?.trim() || undefined,
                        descuentoPct: Number(descuentoPct) || 0,
                        descripcionExtra: descripcionExtra?.trim() || undefined,

                        // calculados (el servicio no los requiere, pero no molesta enviarlos)
                        subtotal: calc.subtotal,
                        descuentoMonto: calc.descuentoMonto,
                        totalOperacion: calc.totalOperacion,
                        precioTotal: calc.totalOperacion,
                        totalNeto: calc.totalNeto,
                        costoUnitarioNeto: calc.costoUnitarioNeto,
                    } as any);
                } catch (err: any) {
                    setError(err.message || "Error al guardar.");
                }
            }}
        >
            {/* Proveedor */}
            <div className="grid-3">
                <div>
                    <label>Proveedor</label>
                    <select
                        value={proveedorId}
                        onChange={(e) => setProveedorId(e.target.value)}
                        required
                    >
                        <option value="">Selecciona…</option>
                        {proveedores.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label>NIT</label>
                    <input value={proveedorSel?.nit || ""} readOnly placeholder="—" />
                </div>
                <div>
                    <label>N° Factura</label>
                    <input
                        value={nroFactura}
                        onChange={(e) => setNroFactura(e.target.value)}
                        placeholder="Ej: 1020"
                    />
                </div>
            </div>

            {/* Producto */}
            <div className="grid-3">
                <div>
                    <label>Producto</label>
                    <select
                        value={productoId}
                        onChange={(e) => setProductoId(e.target.value)}
                        required
                    >
                        <option value="">Selecciona…</option>
                        {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} {p.sku ? `· ${p.sku}` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Fecha</label>
                    <input
                        type="date"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                    />
                </div>

                <div>
                    <label>Unidad de medida</label>
                    <select
                        value={unidadMedida}
                        onChange={(e) => setUnidadMedida(e.target.value)}
                    >
                        {UM_OPTS.map((um) => (
                            <option key={um} value={um}>
                                {um}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Montos */}
            <div className="grid-4">
                <div>
                    <label>Cantidad</label>
                    <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={unidades}
                        onChange={(e) => setUnidades(e.target.value)}
                    />
                </div>
                <div>
                    <label>Precio unitario</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={precioUnitario}
                        onChange={(e) => setPrecioUnitario(e.target.value)}
                    />
                </div>
                <div>
                    <label>Descuento (%)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={descuentoPct}
                        onChange={(e) => setDescuentoPct(e.target.value)}
                    />
                </div>
                <div>
                    <label>IVA (tasa)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={ivaRate}
                        onChange={(e) => setIvaRate(e.target.value)}
                    />
                    <small className="muted">Ej: 0.13 = 13%</small>
                </div>
            </div>

            {/* Descripción */}
            <div>
                <label>Descripción / Especificación</label>
                <textarea
                    rows={2}
                    value={descripcionExtra}
                    onChange={(e) => setDescripcionExtra(e.target.value)}
                    placeholder="Ej: STYROPOR 12x53x100, densidad…, color…"
                />
            </div>

            {/* Totales */}
            <div className="grid-3">
                <div>
                    <label>Subtotal</label>
                    <input value={calc.subtotal} readOnly />
                </div>
                <div>
                    <label>Descuento (monto)</label>
                    <input value={calc.descuentoMonto} readOnly />
                </div>
                <div>
                    <label>Total operación</label>
                    <input value={calc.totalOperacion} readOnly />
                </div>
                <div>
                    <label>Total neto (sin IVA)</label>
                    <input value={calc.totalNeto} readOnly />
                </div>
                <div>
                    <label>Costo unitario neto</label>
                    <input value={calc.costoUnitarioNeto} readOnly />
                </div>
            </div>

            {error && <p className="error">{error}</p>}
            {!canSubmit && (
                <p className="hint">
                    Completa proveedor, producto, fecha, cantidad y precio unitario.
                </p>
            )}

            <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={!canSubmit}>
                    {submitText}
                </button>
            </div>
        </form>
    );
};

export default EntradaForm;
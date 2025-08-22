import React, { useMemo, useState } from "react";
import type { Producto, EntradaInput } from "../../services/types";
import { DEFAULT_IVA_RATE } from "../../services/entradas";

type Props = {
    productos: Producto[];
    onSubmit: (data: EntradaInput) => void;
    submitText?: string;
    ivaDefault?: number; // opcional
};

const EntradaForm: React.FC<Props> = ({ productos, onSubmit, submitText = "Guardar", ivaDefault = DEFAULT_IVA_RATE }) => {
    const [productoId, setProductoId] = useState("");
    const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10)); // YYYY-MM-DD
    const [unidades, setUnidades] = useState<number | string>("");
    const [precioUnitario, setPrecioUnitario] = useState<number | string>("");
    const [ivaRate, setIvaRate] = useState<number | string>(ivaDefault);
    const [error, setError] = useState("");

    // Cálculos en vivo
    const { precioTotal, totalNeto, costoUnitarioNeto } = useMemo(() => {
        const u = Number(unidades) || 0;
        const pu = Number(precioUnitario) || 0;
        const iva = Number(ivaRate) || 0;
        const totalBruto = +(u * pu).toFixed(2);
        const neto = iva >= 0 ? +(totalBruto / (1 + iva)).toFixed(2) : 0;
        const cuNeto = u > 0 ? +(neto / u).toFixed(4) : 0;
        return { precioTotal: totalBruto, totalNeto: neto, costoUnitarioNeto: cuNeto };
    }, [unidades, precioUnitario, ivaRate]);

    const canSubmit = useMemo(() => {
        const u = Number(unidades);
        const pu = Number(precioUnitario);
        const iva = Number(ivaRate);
        return !!productoId && !!fecha && u > 0 && pu > 0 && iva >= 0;
    }, [productoId, fecha, unidades, precioUnitario, ivaRate]);

    return (
        <form
            className="form"
            onSubmit={(e) => {
                e.preventDefault();
                setError("");
                try {
                    onSubmit({
                        productoId,
                        fecha,
                        unidades: Number(unidades),
                        precioUnitario: Number(precioUnitario),
                        ivaRate: Number(ivaRate),
                    });
                } catch (err: any) {
                    setError(err.message || "Error al guardar.");
                }
            }}
        >
            <div className="grid-2">
                <div>
                    <label>Producto</label>
                    <select value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                        <option value="">Selecciona…</option>
                        {productos.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} {p.sku ? `· ${p.sku}` : ""}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label>Fecha</label>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>

                <div>
                    <label>Unidades</label>
                    <input type="number" step="1" min="0" value={unidades} onChange={(e) => setUnidades(e.target.value)} />
                </div>

                <div>
                    <label>Precio unitario (bruto)</label>
                    <input type="number" step="0.01" min="0" value={precioUnitario} onChange={(e) => setPrecioUnitario(e.target.value)} />
                </div>

                <div>
                    <label>IVA (tasa)</label>
                    <input type="number" step="0.01" min="0" value={ivaRate} onChange={(e) => setIvaRate(e.target.value)} />
                    <small className="muted">Ej: 0.13 = 13%</small>
                </div>

                <div>
                    <label>Precio total (bruto)</label>
                    <input value={precioTotal} readOnly />
                </div>

                <div>
                    <label>Total neto</label>
                    <input value={totalNeto} readOnly />
                </div>

                <div>
                    <label>Costo unitario neto</label>
                    <input value={costoUnitarioNeto} readOnly />
                </div>
            </div>

            {error && <p className="error">{error}</p>}
            {!canSubmit && <p className="hint">Completa producto, fecha, unidades y precio unitario.</p>}

            <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={!canSubmit}>{submitText}</button>
            </div>
        </form>
    );
};

export default EntradaForm;
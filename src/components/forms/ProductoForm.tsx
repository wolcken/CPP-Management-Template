import React, { useMemo, useState } from "react";
import type { Marca, Categoria, Proveedor, ProductoInput } from "../../services/types";

type Props = {
    marcas: Marca[];
    categorias: Categoria[];
    proveedores: Proveedor[];
    onSubmit: (data: ProductoInput) => void;
    submitText?: string;
};

const ProductoForm: React.FC<Props> = ({
    marcas, categorias, proveedores, onSubmit, submitText = "Guardar"
}) => {
    const [nombre, setNombre] = useState("");
    const [sku, setSku] = useState("");
    const [marcaId, setMarcaId] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [proveedorId, setProveedorId] = useState("");
    const [unidad, setUnidad] = useState("");
    const [activo, setActivo] = useState(true);
    const [error, setError] = useState("");

    const canSubmit = useMemo(() => {
        return (
            nombre.trim() !== "" &&
            sku.trim() !== "" &&
            !!marcaId && !!categoriaId && !!proveedorId
        );
    }, [nombre, sku, marcaId, categoriaId, proveedorId]);

    return (
        <form
            className="form"
            onSubmit={(e) => {
                e.preventDefault();
                setError("");
                try {
                    onSubmit({
                        nombre,
                        sku,
                        marcaId,
                        categoriaId,
                        proveedorId,
                        unidad: unidad || undefined,
                        activo,
                    });
                } catch (err: any) {
                    setError(err.message || "Error al guardar.");
                }
            }}
        >
            <div className="grid-2">
                <div>
                    <label>Nombre</label>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="P.ej. Codo 1/2&quot; PVC" />
                </div>
                <div>
                    <label>SKU</label>
                    <input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="Código único" />
                </div>

                <div>
                    <label>Marca</label>
                    <select value={marcaId} onChange={(e) => setMarcaId(e.target.value)}>
                        <option value="">Selecciona…</option>
                        {marcas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label>Categoría</label>
                    <select value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)}>
                        <option value="">Selecciona…</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                </div>

                <div>
                    <label>Proveedor</label>
                    <select value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                        <option value="">Selecciona…</option>
                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <label>Unidad (opcional)</label>
                    <input value={unidad} onChange={(e) => setUnidad(e.target.value)} placeholder="unidad / kg / m" />
                </div>

                <div className="switch">
                    <label>Activo</label>
                    <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
                </div>
            </div>

            {error && <p className="error">{error}</p>}
            {!canSubmit && <p className="hint">Completa Nombre, SKU y selecciona Marca, Categoría y Proveedor.</p>}

            <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={!canSubmit}>{submitText}</button>
            </div>
        </form>
    );
};

export default ProductoForm;
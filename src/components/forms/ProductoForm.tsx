import React, { useEffect, useMemo, useState } from "react";
import type { Marca, Categoria, Proveedor, ProductoInput } from "../../services/types";

type Props = {
    marcas: Marca[];
    categorias: Categoria[];
    proveedores: Proveedor[];
    onSubmit: (data: Omit<ProductoInput, "sku">) => void;
    submitText?: string;
};

const ProductoForm: React.FC<Props> = ({
    marcas, categorias, proveedores, onSubmit, submitText = "Guardar"
}) => {
    const [nombre, setNombre] = useState("");
    const [marcaId, setMarcaId] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [proveedorId, setProveedorId] = useState("");
    const [unidad, setUnidad] = useState("");
    const [error, setError] = useState("");

    // Preview visual del SKU (no se envía; se genera en el servicio)
    const [skuPreview, setSkuPreview] = useState("");

    // Normaliza nombre → prefijo (igual que en el service)
    const normalizePrefix = (s: string) =>
        (s || "PRD")
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
            .toUpperCase()
            .replace(/[^A-Z0-9]/g, "")
            .slice(0, 4) || "PRD";

    useEffect(() => {
        const cat = categorias.find(c => c.id === categoriaId);
        const prefix = normalizePrefix(cat?.nombre || "PRD");
        // Solo un preview amigable; la secuencia real se calcula en Firestore
        setSkuPreview(prefix ? `${prefix}-####` : "Se genera automáticamente");
    }, [categoriaId, categorias]);

    const canSubmit = useMemo(() => {
        return (
            nombre.trim() !== "" &&
            !!marcaId && !!categoriaId && !!proveedorId
        );
    }, [nombre, marcaId, categoriaId, proveedorId]);

    return (
        <form
            className="form"
            onSubmit={(e) => {
                e.preventDefault();
                setError("");
                try {
                    onSubmit({
                        nombre,
                        // sku: lo genera el sistema
                        marcaId,
                        categoriaId,
                        proveedorId,
                        unidad: unidad || undefined,
                    });
                } catch (err: any) {
                    setError(err.message || "Error al guardar.");
                }
            }}
        >
            <div className="grid-2">
                <div>
                    <label>Nombre</label>
                    <input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder='P.ej. Codo 1/2" PVC' />
                </div>

                {/* Campo solo lectura para feedback al usuario */}
                <div>
                    <label>SKU (automático)</label>
                    <input value={skuPreview || "Se genera automáticamente"} readOnly />
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

            </div>

            {error && <p className="error">{error}</p>}
            {!canSubmit && <p className="hint">Completa Nombre y selecciona Marca, Categoría y Proveedor.</p>}

            <div className="form-actions">
                <button type="submit" className="btn-primary" disabled={!canSubmit}>{submitText}</button>
            </div>
        </form>
    );
};

export default ProductoForm;
import React from "react";
import Modal from "../Modal";
import type { Producto } from "../../services/types";

type NameMap = Record<string, string | undefined>;

type Props = {
    open: boolean;
    onClose: () => void;
    items: Producto[];
    loading?: boolean;
    onAddClick: () => void;
    onDelete: (id: string) => void;
    marcaById: NameMap;
    categoriaById: NameMap;
    proveedorById: NameMap;
};

const ProductosModal: React.FC<Props> = ({
    open, onClose, items, loading, onAddClick, onDelete,
    marcaById, categoriaById, proveedorById
}) => (
    <Modal open={open} title="Productos" onClose={onClose} onAdd={onAddClick}>
        {loading ? <p>Cargando...</p> : items.length === 0 ? <p>No hay productos aún.</p> : (
            <ul className="list">
                {items.map((p, i) => (
                    <li key={p.id} className="item column">
                        <div className="left wide">
                            <div className="row">
                                <span className="index">{i + 1}.</span>
                                <strong className="name">{p.nombre}</strong>
                                <span className="muted"> · SKU: {p.sku}</span>
                            </div>
                            <div className="muted">
                                {marcaById[p.marcaId] || "—"} · {categoriaById[p.categoriaId] || "—"} · {proveedorById[p.proveedorId] || "—"}
                            </div>
                            {p.unidad && <div className="muted">Unidad: {p.unidad}</div>}
                            {typeof p.activo === "boolean" && (
                                <div className="muted">Estado: {p.activo ? "Activo" : "Inactivo"}</div>
                            )}
                        </div>
                        <button className="btn-circle danger" onClick={() => onDelete(p.id)} title="Eliminar">🗑</button>
                    </li>
                ))}
            </ul>
        )}
    </Modal>
);

export default ProductosModal;
import React from "react";
import Modal from "../Modal";
import type { Proveedor } from "../../services/types";

type Props = {
    open: boolean; onClose: () => void;
    items: Proveedor[]; loading?: boolean;
    onAddClick: () => void; onDelete: (id: string) => void;
};

const ProveedoresModal: React.FC<Props> = ({ open, onClose, items, loading, onAddClick, onDelete }) => (
    <Modal open={open} title="Proveedores" onClose={onClose} onAdd={onAddClick}>
        {loading ? <p>Cargando...</p> : items.length === 0 ? <p>No hay proveedores aún.</p> : (
            <ul className="list">
                {items.map((p, i) => (
                    <li key={p.id} className="item column">
                        <div className="left wide">
                            <div className="row"><span className="index">{i + 1}.</span><strong className="name">{p.nombre}</strong></div>
                            {p.representante && <div className="muted">{p.representante}</div>}
                            {p.direccion && <div className="muted">{p.direccion}</div>}
                            {p.telefono && <div className="muted">{p.telefono}</div>}
                        </div>
                        <button className="btn-circle danger" onClick={() => onDelete(p.id)} title="Eliminar">🗑</button>
                    </li>
                ))}
            </ul>
        )}
    </Modal>
);

export default ProveedoresModal;
import React from "react";
import Modal from "../Modal";
import type { Categoria } from "../../services/types";

type Props = {
    open: boolean; onClose: () => void;
    items: Categoria[]; loading?: boolean;
    onAddClick: () => void; onDelete: (id: string) => void;
};

const CategoriasModal: React.FC<Props> = ({ open, onClose, items, loading, onAddClick, onDelete }) => (
    <Modal open={open} title="Categorías" onClose={onClose} onAdd={onAddClick}>
        {loading ? <p>Cargando...</p> : items.length === 0 ? <p>No hay categorías aún.</p> : (
            <ul className="list">
                {items.map((c, i) => (
                    <li key={c.id} className="item">
                        <div className="left"><span className="index">{i + 1}.</span><strong className="name">{c.nombre}</strong></div>
                        <button className="btn-circle danger" onClick={() => onDelete(c.id)} title="Eliminar">🗑</button>
                    </li>
                ))}
            </ul>
        )}
    </Modal>
);

export default CategoriasModal;
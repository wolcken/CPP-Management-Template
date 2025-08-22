import React from "react";
import Modal from "../Modal";
import type { Marca } from "../../services/types";

type Props = {
    open: boolean;
    onClose: () => void;
    items: Marca[];
    loading?: boolean;
    onAddClick: () => void;
    onDelete: (id: string) => void;
};

const MarcasModal: React.FC<Props> = ({ open, onClose, items, loading, onAddClick, onDelete }) => (
    <Modal open={open} title="Marcas" onClose={onClose} onAdd={onAddClick}>
        {loading ? <p>Cargando...</p> : items.length === 0 ? <p>No hay marcas aún.</p> : (
            <ul className="list">
                {items.map((m, i) => (
                    <li key={m.id} className="item">
                        <div className="left"><span className="index">{i + 1}.</span><strong className="name">{m.nombre}</strong></div>
                        <button className="btn-circle danger" onClick={() => onDelete(m.id)} title="Eliminar">🗑</button>
                    </li>
                ))}
            </ul>
        )}
    </Modal>
);

export default MarcasModal;
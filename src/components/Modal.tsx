import React, { useEffect } from "react";
import "../styles/components/modal.css";

type ModalProps = {
    open: boolean;
    title: string;
    onClose: () => void;
    onAdd?: () => void;            // si se pasa, se muestra el botón "+"
    children: React.ReactNode;
};

const Modal: React.FC<ModalProps> = ({ open, title, onClose, onAdd, children }) => {
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        if (open) window.addEventListener("keydown", onEsc);
        return () => window.removeEventListener("keydown", onEsc);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="modal-backdrop" onMouseDown={onClose}>
            <div
                className="modal"
                onMouseDown={(e) => e.stopPropagation()} // evita cerrar al hacer click dentro
                role="dialog"
                aria-modal="true"
            >
                <div className="modal-header">
                    <div className="modal-title">
                        {onAdd && (
                            <button className="btn-circle success" onClick={onAdd} title="Agregar">
                                +
                            </button>
                        )}
                        <h3>{title}</h3>
                    </div>
                    <button className="btn-close" onClick={onClose} title="Cerrar">
                        ×
                    </button>
                </div>

                <div className="modal-body">{children}</div>
            </div>
        </div>
    );
};

export default Modal;
import React, { useEffect } from "react";
import "../styles/components/modal.css";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

type ModalProps = {
    open: boolean;
    title: string;
    onClose: () => void;
    onAdd?: () => void;                 // si se pasa, se muestra el botón "+"
    children: React.ReactNode;

    // NUEVO: control de tamaño
    size?: ModalSize;                   // default: "md"
    className?: string;                 // opcional: clase extra para el contenedor .modal
    bodyClassName?: string;             // opcional: clase extra para .modal-body
    style?: React.CSSProperties;        // opcional: override puntual (ej. maxWidth)
    bodyStyle?: React.CSSProperties;    // opcional: override para el body
    fullScreenOnMobile?: boolean;       // default: true
};

const Modal: React.FC<ModalProps> = ({
    open,
    title,
    onClose,
    onAdd,
    children,
    size = "md",
    className = "",
    bodyClassName = "",
    style,
    bodyStyle,
    fullScreenOnMobile = true,
}) => {
    useEffect(() => {
        const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
        if (open) {
            window.addEventListener("keydown", onEsc);
            // Bloquea scroll del body
            document.body.style.overflow = "hidden";
        }
        return () => {
            window.removeEventListener("keydown", onEsc);
            document.body.style.overflow = "";
        };
    }, [open, onClose]);

    if (!open) return null;

    // clases de tamaño
    const sizeClass = `modal-${size}`;
    const mobileClass = fullScreenOnMobile ? "modal-mobile-full" : "";

    return (
        <div className="modal-backdrop" onMouseDown={onClose} role="presentation">
            <div
                className={`modal ${sizeClass} ${mobileClass} ${className}`}
                onMouseDown={(e) => e.stopPropagation()} // evita cerrar al hacer click dentro
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                style={style}
            >
                <div className="modal-header">
                    <div className="modal-title">
                        {onAdd && (
                            <button className="btn-circle success" onClick={onAdd} title="Agregar" type="button">
                                +
                            </button>
                        )}
                        <h3 id="modal-title">{title}</h3>
                    </div>
                    <button className="btn-close" onClick={onClose} title="Cerrar" type="button">
                        ×
                    </button>
                </div>

                <div className={`modal-body ${bodyClassName}`} style={bodyStyle}>
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
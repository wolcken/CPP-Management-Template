import React from "react";
import Modal from "../Modal";
import CategoriaForm from "../forms/CategoriaForm";

const AddCategoriaModal: React.FC<{ open: boolean; onClose: () => void; onSubmit: (nombre: string) => void; }> =
    ({ open, onClose, onSubmit }) => (
        <Modal open={open} title="Nueva categoría" onClose={onClose}>
            <CategoriaForm onSubmit={onSubmit} />
        </Modal>
    );

export default AddCategoriaModal;
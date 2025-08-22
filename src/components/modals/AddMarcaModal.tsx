import React from "react";
import Modal from "../Modal";
import MarcaForm from "../forms/MarcaForm";

const AddMarcaModal: React.FC<{ open: boolean; onClose: () => void; onSubmit: (nombre: string) => void; }> =
    ({ open, onClose, onSubmit }) => (
        <Modal open={open} title="Nueva marca" onClose={onClose}>
            <MarcaForm onSubmit={onSubmit} />
        </Modal>
    );

export default AddMarcaModal;
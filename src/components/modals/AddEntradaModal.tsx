import React from "react";
import Modal from "../Modal";
import EntradaForm from "../forms/EntradaForm";
import type { Producto, EntradaInput } from "../../services/types";

type Props = {
    open: boolean;
    onClose: () => void;
    productos: Producto[];
    onSubmit: (data: EntradaInput) => void;
};

const AddEntradaModal: React.FC<Props> = ({ open, onClose, productos, onSubmit }) => (
    <Modal open={open} title="Nueva entrada / compra" onClose={onClose}>
        <EntradaForm productos={productos} onSubmit={onSubmit} submitText="Registrar compra" />
    </Modal>
);

export default AddEntradaModal;
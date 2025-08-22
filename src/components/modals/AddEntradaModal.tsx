import React from "react";
import Modal from "../Modal";
import EntradaForm from "../forms/EntradaForm";
import type { Producto, EntradaInput, Proveedor } from "../../services/types";

type Props = {
    open: boolean;
    onClose: () => void;
    productos: Producto[];
    proveedores: Proveedor[];
    onSubmit: (data: EntradaInput & any) => void;
};

const AddEntradaModal: React.FC<Props> = ({ open, onClose, productos, proveedores, onSubmit }) => (
    <Modal open={open} title="Nueva entrada / compra" onClose={onClose}>
        <EntradaForm productos={productos} proveedores={proveedores} onSubmit={onSubmit} submitText="Registrar compra" />
    </Modal>
);

export default AddEntradaModal;
import React from "react";
import Modal from "../Modal";
import ProveedorForm from "../forms/ProveedorForm";

type Data = {
    nombre: string;
    nit: string;
    representante?: string;
    direccion?: string;
    telefono?: string;
};

const AddProveedorModal: React.FC<{ open: boolean; onClose: () => void; onSubmit: (data: Data) => void; }> =
    ({ open, onClose, onSubmit }) => (
        <Modal open={open} title="Nuevo proveedor" onClose={onClose}>
            <ProveedorForm onSubmit={onSubmit} />
        </Modal>
    );

export default AddProveedorModal;
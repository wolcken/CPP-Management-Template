import React from "react";
import Modal from "../Modal";
import FacturasForm from "../forms/FacturasForm";
import type { Producto, FacturaInput } from "../../services/types";
import "../../styles/components/factura.css";

type Props = {
    open: boolean;
    onClose: () => void;
    productos: Producto[];
    onSubmit: (data: FacturaInput & any) => void;
};

const AddFacturaModal: React.FC<Props> = ({ open, onClose, productos, onSubmit }) => (
    <Modal open={open} title="Nueva salida" onClose={onClose} size="xl" bodyClassName="tall">
        <FacturasForm productos={productos} onSubmit={onSubmit} submitText="Registrar boleta" />
    </Modal>
);

export default AddFacturaModal;
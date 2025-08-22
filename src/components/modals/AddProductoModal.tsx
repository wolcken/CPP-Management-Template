import React from "react";
import Modal from "../Modal";
import ProductoForm from "../forms/ProductoForm";
import type { Marca, Categoria, Proveedor, ProductoInput } from "../../services/types";

type Props = {
    open: boolean;
    onClose: () => void;
    marcas: Marca[];
    categorias: Categoria[];
    proveedores: Proveedor[];
    onSubmit: (data: ProductoInput) => void;
};

const AddProductoModal: React.FC<Props> = ({ open, onClose, marcas, categorias, proveedores, onSubmit }) => (
    <Modal open={open} title="Nuevo producto" onClose={onClose}>
        <ProductoForm marcas={marcas} categorias={categorias} proveedores={proveedores} onSubmit={onSubmit} submitText="Crear" />
    </Modal>
);

export default AddProductoModal;
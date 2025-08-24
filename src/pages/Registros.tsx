import React, { useEffect, useMemo, useState } from "react";
import "../styles/pages/registros.css";

import type { Marca, Categoria, Proveedor, Producto, ProductoInput } from "../services/types";
import { subscribeMarcas, createMarca, deleteMarca } from "../services/marcas";
import { subscribeCategorias, createCategoria, deleteCategoria } from "../services/categorias";
import { subscribeProveedores, createProveedor, deleteProveedor } from "../services/proveedores";
import { subscribeProductos, createProductoAutoSkuPorCategoria, deleteProducto } from "../services/productos";

import MarcasModal from "../components/modals/MarcasModal";
import CategoriasModal from "../components/modals/CategoriasModal";
import ProveedoresModal from "../components/modals/ProveedoresModal";
import ProductosModal from "../components/modals/ProductosModal";

import AddMarcaModal from "../components/modals/AddMarcaModal";
import AddCategoriaModal from "../components/modals/AddCategoriaModal";
import AddProveedorModal from "../components/modals/AddProveedorModal";
import AddProductoModal from "../components/modals/AddProductoModal";

const Registros: React.FC = () => {
    // ---- UI state (list modals) ----
    const [openMarca, setOpenMarca] = useState(false);
    const [openCategoria, setOpenCategoria] = useState(false);
    const [openProveedor, setOpenProveedor] = useState(false);
    const [openProducto, setOpenProducto] = useState(false);

    // ---- UI state (add modals) ----
    const [openAddMarca, setOpenAddMarca] = useState(false);
    const [openAddCategoria, setOpenAddCategoria] = useState(false);
    const [openAddProveedor, setOpenAddProveedor] = useState(false);
    const [openAddProducto, setOpenAddProducto] = useState(false);

    // ---- Data ----
    const [marcas, setMarcas] = useState<Marca[]>([]);
    const [categorias, setCategorias] = useState<Categoria[]>([]);
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);

    // ---- Loading flags ----
    const [loadingMarca, setLoadingMarca] = useState(true);
    const [loadingCategoria, setLoadingCategoria] = useState(true);
    const [loadingProveedor, setLoadingProveedor] = useState(true);
    const [loadingProducto, setLoadingProducto] = useState(true);

    // ---- Subscriptions ----
    useEffect(() => {
        const u = subscribeMarcas(rows => { setMarcas(rows); setLoadingMarca(false); });
        return () => u();
    }, []);
    useEffect(() => {
        const u = subscribeCategorias(rows => { setCategorias(rows); setLoadingCategoria(false); });
        return () => u();
    }, []);
    useEffect(() => {
        const u = subscribeProveedores(rows => { setProveedores(rows); setLoadingProveedor(false); });
        return () => u();
    }, []);
    useEffect(() => {
        const u = subscribeProductos(rows => { setProductos(rows); setLoadingProducto(false); });
        return () => u();
    }, []);

    // ---- Display maps (id -> nombre) ----
    const marcaById = useMemo(() => Object.fromEntries(marcas.map(m => [m.id, m.nombre])), [marcas]);
    const categoriaById = useMemo(() => Object.fromEntries(categorias.map(c => [c.id, c.nombre])), [categorias]);
    const proveedorById = useMemo(() => Object.fromEntries(proveedores.map(p => [p.id, p.nombre])), [proveedores]);

    // ---- Create handlers ----
    const onAddMarca = async (nombre: string) => {
        try {
            await createMarca(nombre);
            setOpenAddMarca(false);
        } catch (e: any) {
            alert(e.message || "No se pudo crear la marca");
        }
    };

    const onAddCategoria = async (nombre: string) => {
        try {
            await createCategoria(nombre);
            setOpenAddCategoria(false);
        } catch (e: any) {
            alert(e.message || "No se pudo crear la categoría");
        }
    };

    const onAddProveedor = async (data: Omit<Proveedor, "id">) => {
        try {
            await createProveedor(data);
            setOpenAddProveedor(false);
        } catch (e: any) {
            alert(e.message || "No se pudo crear el proveedor");
        }
    };

    const onAddProducto = async (data: Omit<ProductoInput, "sku">) => {
        try {
            const { sku } = await createProductoAutoSkuPorCategoria(data);
            alert(`Producto creado con SKU ${sku}`);
            setOpenAddProducto(false);
        } catch (e: any) {
            alert(e.message || "No se pudo crear el producto");
        }
    };

    // ---- Delete handlers ----
    const onDeleteMarca = async (id: string) => {
        if (!confirm("¿Eliminar esta marca?")) return;
        try { await deleteMarca(id); } catch (e: any) { alert(e.message || "No se pudo eliminar la marca"); }
    };

    const onDeleteCategoria = async (id: string) => {
        if (!confirm("¿Eliminar esta categoría?")) return;
        try { await deleteCategoria(id); } catch (e: any) { alert(e.message || "No se pudo eliminar la categoría"); }
    };

    const onDeleteProveedor = async (id: string) => {
        if (!confirm("¿Eliminar este proveedor?")) return;
        try { await deleteProveedor(id); } catch (e: any) { alert(e.message || "No se pudo eliminar el proveedor"); }
    };

    const onDeleteProducto = async (id: string) => {
        if (!confirm("¿Eliminar este producto?")) return;
        try { await deleteProducto(id); } catch (e: any) { alert(e.message || "No se pudo eliminar el producto"); }
    };

    // ---- Counts ----
    const counts = useMemo(() => ({
        marca: marcas.length,
        categoria: categorias.length,
        proveedor: proveedores.length,
        producto: productos.length,
    }), [marcas, categorias, proveedores, productos]);

    return (
        <div className="registros-page">
            <h2>🧾 Registros</h2>
            <p className="subtitle">Gestiona catálogos base del sistema.</p>

            <div className="actions-grid">
                <button className="card-btn green" onClick={() => setOpenProveedor(true)}>
                    <span className="title">Proveedores</span>
                    <span className="meta">{counts.proveedor} registrados</span>
                </button>

                <button className="card-btn blue" onClick={() => setOpenCategoria(true)}>
                    <span className="title">Categorías</span>
                    <span className="meta">{counts.categoria} registradas</span>
                </button>

                <button className="card-btn indigo" onClick={() => setOpenMarca(true)}>
                    <span className="title">Marcas</span>
                    <span className="meta">{counts.marca} registradas</span>
                </button>

                <button className="card-btn purple" onClick={() => setOpenProducto(true)}>
                    <span className="title">Productos</span>
                    <span className="meta">{counts.producto} registrados</span>
                </button>
            </div>

            {/* ===== List Modals ===== */}
            <MarcasModal
                open={openMarca}
                onClose={() => setOpenMarca(false)}
                items={marcas}
                loading={loadingMarca}
                onAddClick={() => setOpenAddMarca(true)}
                onDelete={onDeleteMarca}
            />

            <CategoriasModal
                open={openCategoria}
                onClose={() => setOpenCategoria(false)}
                items={categorias}
                loading={loadingCategoria}
                onAddClick={() => setOpenAddCategoria(true)}
                onDelete={onDeleteCategoria}
            />

            <ProveedoresModal
                open={openProveedor}
                onClose={() => setOpenProveedor(false)}
                items={proveedores}
                loading={loadingProveedor}
                onAddClick={() => setOpenAddProveedor(true)}
                onDelete={onDeleteProveedor}
            />

            <ProductosModal
                open={openProducto}
                onClose={() => setOpenProducto(false)}
                items={productos}
                loading={loadingProducto}
                onAddClick={() => setOpenAddProducto(true)}
                onDelete={onDeleteProducto}
                marcaById={marcaById}
                categoriaById={categoriaById}
                proveedorById={proveedorById}
            />

            {/* ===== Add Modals ===== */}
            <AddMarcaModal
                open={openAddMarca}
                onClose={() => setOpenAddMarca(false)}
                onSubmit={onAddMarca}
            />
            <AddCategoriaModal
                open={openAddCategoria}
                onClose={() => setOpenAddCategoria(false)}
                onSubmit={onAddCategoria}
            />
            <AddProveedorModal
                open={openAddProveedor}
                onClose={() => setOpenAddProveedor(false)}
                onSubmit={onAddProveedor}
            />
            <AddProductoModal
                open={openAddProducto}
                onClose={() => setOpenAddProducto(false)}
                marcas={marcas}
                categorias={categorias}
                proveedores={proveedores}
                onSubmit={onAddProducto}
            />
        </div>
    );
};

export default Registros;
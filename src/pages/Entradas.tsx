import React, { useEffect, useState } from "react";
import "../styles/pages/entradas.css";

import type { Entrada, Producto } from "../services/types";
import { subscribeProductos } from "../services/productos";
import {
    createEntrada,
    getEntradasFirstPage,
    getEntradasNextPage,
    getEntradasPrevPage,
    deleteEntrada,
} from "../services/entradas";

import AddEntradaModal from "../components/modals/AddEntradaModal";
import { exportEntradasPdf } from "../utils/pdf/exportEntradasPdf";

const currency = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });
const fmtDate = (ts: any) => {
    try {
        const d = ts?.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString("es-BO");
    } catch { return "—"; }
};

const PAGE_SIZE = 10;

const Entradas: React.FC = () => {
    const [items, setItems] = useState<Entrada[]>([]);
    const [loading, setLoading] = useState(true);

    // cursores
    const [firstDoc, setFirstDoc] = useState<any | null>(null);
    const [lastDoc, setLastDoc] = useState<any | null>(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);

    // productos para el modal
    const [productos, setProductos] = useState<Producto[]>([]);
    useEffect(() => {
        const unsub = subscribeProductos(setProductos);
        return () => unsub();
    }, []);

    const loadFirst = async () => {
        setLoading(true);
        const page = await getEntradasFirstPage(PAGE_SIZE);
        setItems(page.items);
        setFirstDoc(page.firstDoc);
        setLastDoc(page.lastDoc);
        setPageIndex(0);
        setCanPrev(false);
        setCanNext(!!page.lastDoc && page.items.length === PAGE_SIZE);
        setLoading(false);
    };

    useEffect(() => {
        loadFirst();
    }, []);

    const nextPage = async () => {
        if (!lastDoc) return;
        setLoading(true);
        const page = await getEntradasNextPage(PAGE_SIZE, lastDoc);
        setItems(page.items);
        setFirstDoc(page.firstDoc);
        setLastDoc(page.lastDoc);
        setPageIndex((i) => i + 1);
        setCanPrev(true);
        setCanNext(!!page.lastDoc && page.items.length === PAGE_SIZE);
        setLoading(false);
    };

    const prevPage = async () => {
        if (!firstDoc) return;
        setLoading(true);
        const page = await getEntradasPrevPage(PAGE_SIZE, firstDoc);
        setItems(page.items);
        setFirstDoc(page.firstDoc);
        setLastDoc(page.lastDoc);
        setPageIndex((i) => Math.max(0, i - 1));
        setCanPrev(page.items.length === PAGE_SIZE && pageIndex - 1 > 0);
        setCanNext(true);
        setLoading(false);
    };

    // alta
    const [openAdd, setOpenAdd] = useState(false);
    const onAdd = async (data: { productoId: string; fecha: string | Date; unidades: number; precioUnitario: number; ivaRate?: number; }) => {
        try {
            await createEntrada(data);
            setOpenAdd(false);
            await loadFirst(); // recarga para ver la nueva arriba
        } catch (e: any) {
            alert(e.message || "No se pudo registrar la entrada");
        }
    };

    // eliminar
    const onDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta entrada?")) return;
        try {
            await deleteEntrada(id);
            // recarga página actual de forma simple (primera)
            await loadFirst();
        } catch (e: any) {
            alert(e.message || "No se pudo eliminar la entrada");
        }
    };

    // handler PDF
    const handleExportEntradas = () => {
        if (!items.length) return;
        // Pasamos las filas tal como las tienes en la tabla
        exportEntradasPdf(items, {
            subtitle: "Reporte de compras",
            fileName: "entradas",
            // filtros: ["Rango: —", "Proveedor: —"], // si luego agregas filtros
        });
    };

    return (
        <div className="entradas-page">
            <div className="toolbar">
                <h2>📥 Entradas (compras)</h2>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={handleExportEntradas} disabled={loading || items.length === 0}>
                        Imprimir
                    </button>
                    <button className="btn-primary" onClick={() => setOpenAdd(true)}>+ Nueva entrada</button>
                </div>
            </div>

            {loading ? (
                <p>Cargando...</p>
            ) : items.length === 0 ? (
                <p>No hay entradas registradas.</p>
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Producto</th>
                                <th>Unidades</th>
                                <th>Precio unit. (bruto)</th>
                                <th>Precio total (bruto)</th>
                                <th>Total neto</th>
                                <th>Costo unit. neto</th>
                                <th style={{ width: 110 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((e) => (
                                <tr key={e.id}>
                                    <td>{fmtDate(e.fecha)}</td>
                                    <td>
                                        <div className="cell-p">
                                            <strong>{e.productoNombre || "—"}</strong>
                                            {e.productoSku && <span className="muted"> · {e.productoSku}</span>}
                                        </div>
                                    </td>
                                    <td>{e.unidades}</td>
                                    <td>{currency.format(e.precioUnitario)}</td>
                                    <td>{currency.format(e.precioTotal)}</td>
                                    <td>{currency.format(e.totalNeto)}</td>
                                    <td>{currency.format(e.costoUnitarioNeto)}</td>
                                    <td className="actions">
                                        <button className="btn-circle danger" onClick={() => onDelete(e.id)} title="Eliminar">🗑</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="pagination">
                <button className="btn" disabled={!canPrev} onClick={prevPage}>← Anterior</button>
                <span className="muted">Página {pageIndex + 1}</span>
                <button className="btn" disabled={!canNext} onClick={nextPage}>Siguiente →</button>
            </div>

            <AddEntradaModal
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                productos={productos}
                onSubmit={onAdd}
            />
        </div>
    );
};

export default Entradas;
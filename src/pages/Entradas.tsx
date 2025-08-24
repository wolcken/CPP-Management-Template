import React, { useEffect, useState } from "react";
import "../styles/pages/entradas.css";

import type { Entrada, Producto, Proveedor } from "../services/types";
import { subscribeProductos } from "../services/productos";
import { subscribeProveedores } from "../services/proveedores";
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

    // productos
    const [productos, setProductos] = useState<Producto[]>([]);
    useEffect(() => {
        const unsub = subscribeProductos(setProductos);
        return () => unsub();
    }, []);

    // proveedores
    const [proveedores, setProveedores] = useState<Proveedor[]>([]);
    useEffect(() => {
        const unsub = subscribeProveedores(setProveedores);
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

    useEffect(() => { loadFirst(); }, []);

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
    const onAdd = async (data: any) => {
        try {
            await createEntrada(data);
            setOpenAdd(false);
            await loadFirst();
        } catch (e: any) {
            alert(e.message || "No se pudo registrar la entrada");
        }
    };

    // eliminar
    const onDelete = async (id: string) => {
        if (!confirm("¿Eliminar esta entrada?")) return;
        try {
            await deleteEntrada(id);
            await loadFirst();
        } catch (e: any) {
            alert(e.message || "No se pudo eliminar la entrada");
        }
    };

    // PDF
    const handleExportEntradas = () => {
        if (!items.length) return;
        exportEntradasPdf(items as any, {
            subtitle: "Reporte de compras",
            fileName: "entradas",
        });
    };

    return (
        <div className="entradas-page">
            <div className="toolbar">
                <h2>📥 Entradas</h2>
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
                                <th>Proveedor</th>
                                <th>NIT</th>
                                <th>N° Fact.</th>
                                <th>Producto</th>
                                <th>U. Medida</th>
                                <th>Cant.</th>
                                <th>P.Unit (bruto)</th>
                                <th>Subtotal</th>
                                <th>Desc. (%)</th>
                                <th>Total operación</th>
                                <th>Total neto</th>
                                <th>C.U. neto</th>
                                <th style={{ width: 110 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((e: any) => (
                                <tr key={e.id}>
                                    <td>{fmtDate(e.fecha)}</td>
                                    <td>{e.proveedorNombre || e.proveedor || "—"}</td>
                                    <td>{e.proveedorNit || "—"}</td>
                                    <td>{e.nroFactura || "—"}</td>
                                    <td>
                                        <div className="cell-p">
                                            <strong>{e.productoNombre || "—"}</strong>
                                            {e.productoSku && <span className="muted"> · {e.productoSku}</span>}
                                            {e.descripcionExtra && <div className="muted" style={{ fontSize: 12 }}>{e.descripcionExtra}</div>}
                                        </div>
                                    </td>
                                    <td>{e.unidadMedida || "—"}</td>
                                    <td>{e.unidades}</td>
                                    <td>{currency.format(e.precioUnitario)}</td>
                                    <td>{currency.format(e.subtotal ?? (e.unidades * e.precioUnitario))}</td>
                                    <td>{typeof e.descuentoPct === "number" ? `${e.descuentoPct}%` : "0%"}</td>
                                    <td>{currency.format(e.totalOperacion ?? e.precioTotal)}</td>
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
                proveedores={proveedores}
                onSubmit={onAdd}
            />
        </div>
    );
};

export default Entradas;
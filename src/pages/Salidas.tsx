import React, { useEffect, useState } from "react";
import "../styles/pages/salidas.css";
import type { Factura, Producto } from "../services/types";
import { subscribeProductos } from "../services/productos";
import {
    getFacturasFirstPage,
    getFacturasNextPage,
    getFacturasPrevPage,
    getFacturaById
} from "../services/facturas";

import FacturaViewModal from "../components/modals/FacturaViewModal";
import AddFacturaModal from "../components/modals/AddFacturaModal";
import { createFactura } from "../services/facturas";
import { exportSalidasPdf } from "../utils/pdf/exportSalidasPdf";

const currency = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });
const fmtDate = (ts: any) => {
    try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString("es-BO"); }
    catch { return "—"; }
};

const PAGE_SIZE = 10;

const Salidas: React.FC = () => {

    const [items, setItems] = useState<Factura[]>([]);
    const [loading, setLoading] = useState(true);

    const [firstDoc, setFirstDoc] = useState<any | null>(null);
    const [lastDoc, setLastDoc] = useState<any | null>(null);
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(false);
    const [pageIndex, setPageIndex] = useState(0);

    const [productos, setProductos] = useState<Producto[]>([]);
    const [openAdd, setOpenAdd] = useState(false);

    useEffect(() => {
        const unsub = subscribeProductos(setProductos);
        return () => unsub();
    }, []);

    const loadFirst = async () => {
        setLoading(true);
        const page = await getFacturasFirstPage(PAGE_SIZE);
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
        const page = await getFacturasNextPage(PAGE_SIZE, lastDoc);
        setItems(page.items);
        setFirstDoc(page.firstDoc);
        setLastDoc(page.lastDoc);
        setPageIndex(i => i + 1);
        setCanPrev(true);
        setCanNext(!!page.lastDoc && page.items.length === PAGE_SIZE);
        setLoading(false);
    };

    const prevPage = async () => {
        if (!firstDoc) return;
        setLoading(true);
        const page = await getFacturasPrevPage(PAGE_SIZE, firstDoc);
        setItems(page.items);
        setFirstDoc(page.firstDoc);
        setLastDoc(page.lastDoc);
        setPageIndex(i => Math.max(0, i - 1));
        setCanPrev(page.items.length === PAGE_SIZE && pageIndex - 1 > 0);
        setCanNext(true);
        setLoading(false);
    };

    // Modal de detalle
    const [openView, setOpenView] = useState(false);
    const [detalle, setDetalle] = useState<Factura | null>(null);

    const onView = async (id: string) => {
        try {
            setDetalle(null);
            setOpenView(true);
            const f = await getFacturaById(id);
            setDetalle(f);
        } catch (e: any) {
            alert(e.message || "No se pudo cargar la factura");
            setOpenView(false);
        }
    };

    const handleExportSalidas = () => {
        if (!items.length) return;
        exportSalidasPdf(items, {
            subtitle: "Reporte de facturas",
            fileName: "salidas",
        });
    };

    const onAdd = async (data: any) => {
        try {
            await createFactura(data);
            setOpenAdd(false);
            await loadFirst(); // refresca la tabla
        } catch (e: any) {
            alert(e.message || "No se pudo registrar la boleta");
        }
    };

    return (
        <div className="salidas-page">
            <div className="toolbar">
                <h2>📤 Salidas</h2>
                <div style={{ display: "flex", gap: 8 }}>
                    <button className="btn" onClick={handleExportSalidas} disabled={loading || items.length === 0}>
                        Imprimir
                    </button>
                    <button className="btn-primary" onClick={() => setOpenAdd(true)}>+ Nueva salida</button>
                </div>
            </div>

            {loading ? (
                <p>Cargando...</p>
            ) : items.length === 0 ? (
                <p>No hay facturas registradas.</p>
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>No.</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Items</th>
                                <th>Subtotal</th>
                                <th style={{ width: 140 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((f) => (
                                <tr key={f.id}>
                                    <td>{f.numero}</td>
                                    <td>{fmtDate(f.fecha)}</td>
                                    <td>{f.clienteNombre || "—"}</td>
                                    <td>{f.items?.length || 0}</td>
                                    <td>{currency.format(f.subtotal)}</td>
                                    <td className="actions">
                                        <button className="btn" onClick={() => onView(f.id)}>👁 Ver factura</button>
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

            <FacturaViewModal open={openView} onClose={() => setOpenView(false)} factura={detalle} />

            {/* Modal de creación */}
            <AddFacturaModal
                open={openAdd}
                onClose={() => setOpenAdd(false)}
                productos={productos}
                onSubmit={onAdd}
            />
        </div>
    );
};

export default Salidas;
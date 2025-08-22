import React from "react";
import Modal from "../Modal";
import type { Factura } from "../../services/types";

const currency = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });
const fmtDate = (ts: any) => {
    try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString("es-BO"); }
    catch { return "—"; }
};

const FacturaViewModal: React.FC<{
    open: boolean;
    onClose: () => void;
    factura: Factura | null;
}> = ({ open, onClose, factura }) => {
    return (
        <Modal open={open} title="Detalle de factura" onClose={onClose}>
            {!factura ? (
                <p>Cargando...</p>
            ) : (
                <div className="factura-view">
                    <div className="grid-2" style={{ marginBottom: 12 }}>
                        <div><strong>No.:</strong> {factura.numero}</div>
                        <div><strong>Fecha:</strong> {fmtDate(factura.fecha)}</div>
                        <div><strong>Cliente:</strong> {factura.clienteNombre || "—"}</div>
                        <div><strong>NIT:</strong> {factura.clienteNIT || "—"}</div>
                    </div>

                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Detalle</th>
                                    <th>Precio</th>
                                    <th>Cantidad</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {factura.items.map((it, idx) => (
                                    <tr key={idx}>
                                        <td>{it.sku || "—"}</td>
                                        <td>
                                            <div className="cell-p">
                                                <strong>{it.nombre}</strong>
                                                {it.unidad && <span className="muted"> · {it.unidad}</span>}
                                            </div>
                                        </td>
                                        <td>{currency.format(it.precioUnitario)}</td>
                                        <td>{it.cantidad}</td>
                                        <td>{currency.format(it.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr>
                                    <td colSpan={4} className="right bold">Subtotal:</td>
                                    <td className="bold">{currency.format(factura.subtotal)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default FacturaViewModal;
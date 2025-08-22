import React from "react";
import Modal from "../Modal";
import type { KardexResult } from "../../services/inventario";
import { exportKardexPdf } from "../../utils/pdf/exportKardexPdf";

const currency = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });
const fmtDate = (ts: any) => {
    try { const d = ts?.toDate ? ts.toDate() : new Date(ts); return d.toLocaleDateString("es-BO"); }
    catch { return "—"; }
};

const KardexModal: React.FC<{
    open: boolean;
    onClose: () => void;
    productoNombre: string;
    resultado: KardexResult | null;
}> = ({ open, onClose, productoNombre, resultado }) => {
    return (
        <Modal
            open={open}
            title={`Kárdex · ${productoNombre}`}
            onClose={onClose}
            size="xl"               // ⬅️ más ancho (usa tus clases .modal-xl)
            bodyClassName="tall"    // ⬅️ más alto útil (85vh según tu CSS)
        >
            {!resultado ? (
                <p>Cargando kárdex…</p>
            ) : (
                <>
                    <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                        <button
                            className="btn"
                            onClick={() => exportKardexPdf(productoNombre, resultado!, {})}
                        >
                            Imprimir
                        </button>
                    </div>

                    <div className="kardex-resumen">
                        <div><strong>Stock actual:</strong> {resultado.resumen.stock}</div>
                        <div><strong>CPP:</strong> {currency.format(resultado.resumen.cpp)}</div>
                        <div><strong>Valorizado:</strong> {currency.format(resultado.resumen.valorizado)}</div>
                    </div>

                    <div className="table-wrap">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th colSpan={1} rowSpan={2} style={{ paddingBottom: 25 }}>Fecha</th>
                                    <th colSpan={1} rowSpan={2} style={{ paddingBottom: 25 }}>Concepto</th>
                                    <th colSpan={3} style={{ textAlign: "center" }}>Unidades</th>
                                    <th colSpan={1} rowSpan={2} style={{ width: 100, textAlign: "center" }}>Costo Unit. (CPP)</th>
                                    <th colSpan={3} style={{ textAlign: "center" }}>Importes</th>
                                </tr>
                                <tr>
                                    <th className="right">Entradas</th>
                                    <th className="right">Salidas</th>
                                    <th className="right">Saldo (Unid.)</th>
                                    <th className="right">Entradas</th>
                                    <th className="right">Salidas</th>
                                    <th className="right">Saldo (Total)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {resultado.rows.length === 0 ? (
                                    <tr><td colSpan={9} className="muted">Sin movimientos</td></tr>
                                ) : resultado.rows.map((r, idx) => (
                                    <tr key={idx}>
                                        <td>{fmtDate(r.fecha)}</td>
                                        <td>{r.concepto}</td>
                                        <td className="right">{r.entradaUnidades ? `${r.entradaUnidades}` : "—"}</td>
                                        <td className="right">{r.salidaUnidades ? `${r.salidaUnidades}` : "—"}</td>
                                        <td className="right">{r.saldoUnidades}</td>
                                        <td className="right cpp-col">{currency.format(r.cpp)}</td>
                                        <td className="right">{r.entradaUnidades ? currency.format(r.entradaTotal || 0) : "—"}</td>
                                        <td className="right">{r.salidaUnidades ? currency.format(r.salidaTotal || 0) : "—"}</td>
                                        <td className="right">{currency.format(r.saldoTotal)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </Modal>
    );
};

export default KardexModal;
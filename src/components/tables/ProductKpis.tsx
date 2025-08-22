import React from "react";
import { type ProductKpi } from "../../types/dashboard";


const fmtCurrency3 = (n?: number) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n || 0);
const fmtNumber3 = (n?: number) => new Intl.NumberFormat("es-BO").format(n || 0);


export const ProductKpis: React.FC<{ rows: ProductKpi[] }> = ({ rows }) => (
    <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
                <tr>
                    <th style={th}>Producto</th>
                    <th style={th}>Stock</th>
                    <th style={th}>CPP</th>
                    <th style={th}>Última salida</th>
                </tr>
            </thead>
            <tbody>
                {rows.map((p) => (
                    <tr key={p.id}>
                        <td style={tdLeft}>{p.nombre}</td>
                        <td style={tdCenter}>{fmtNumber3(p.stock)}</td>
                        <td style={tdCenter}>{fmtCurrency3(p.cpp)}</td>
                        <td style={tdCenter}>{p.ultimaSalida ? new Date(p.ultimaSalida).toLocaleDateString("es-BO") : "—"}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);


const th: React.CSSProperties = {
    textAlign: "left",
    fontSize: 12,
    padding: "10px 8px",
    color: "#475569",
    borderBottom: "1px solid #e2e8f0",
};
const tdLeft: React.CSSProperties = {
    padding: "10px 8px",
    fontSize: 13,
    color: "#0f172a",
    borderBottom: "1px solid #f1f5f9",
};
const tdCenter: React.CSSProperties = { ...tdLeft, textAlign: "center" };
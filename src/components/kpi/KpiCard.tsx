import React from "react";

type Props = { label: string; value: string | number; hint?: string };

export const KpiCard: React.FC<Props> = ({ label, value, hint }) => (
    <div style={{
        background: "#fff",
        border: "1px solid #e5e7eb",
        borderRadius: 16,
        padding: 20,
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        textAlign: "center",
    }}>
        <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#0f172a" }}>{value}</div>
        {hint && <div style={{ fontSize: 12, color: "#16a34a", marginTop: 4 }}>{hint}</div>}
    </div>
);
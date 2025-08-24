import React, { useMemo, useState } from "react";
import { useDashboardData } from "../hooks/useDashboardData";
import { KpiCard } from "../components/kpi/KpiCard";
import { MonthlyLine } from "../components/charts/MonthlyLine";
import { TopProductsBar } from "../components/charts/TopProductsBar";
import { CategoryStackedArea } from "../components/charts/CategoryStackedArea";
import { ProductKpis } from "../components/tables/ProductKpis";


const fmtCurrency4 = (n?: number) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB", maximumFractionDigits: 0 }).format(n || 0);
const fmtNumber4 = (n?: number) => new Intl.NumberFormat("es-BO").format(n || 0);


const Card: React.FC<{ title?: string; children: React.ReactNode }> = ({ title, children }) => (
    <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 16, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
        {title && <div style={{ fontSize: 14, color: "#334155", marginBottom: 8, fontWeight: 600 }}>{title}</div>}
        {children}
    </div>
);


const Estadisticas: React.FC = () => {
    const [monthsWindow, setMonthsWindow] = useState<number>(12);
    const { data, kpis, loading, error } = useDashboardData(monthsWindow);


    const kpiCards = useMemo(() => [
        { label: "Facturas (rango)", value: kpis ? fmtNumber4(kpis.facturas) : "…", hint: "↑ Tendencia mensual" },
        { label: "Ingresos (rango)", value: kpis ? fmtCurrency4(kpis.ingresos) : "…", hint: "↑ vs mes anterior" },
        { label: "Stock global", value: kpis ? fmtNumber4(kpis.stock) : "…", hint: "≈ Disponible" },
    ], [kpis]);


    return (
        <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh", boxSizing: "border-box" }}>
            <h1 style={{ fontSize: 22, margin: 0, marginBottom: 16, color: "#0f172a" }}>📊 Estadísticas</h1>


            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <label style={{ fontSize: 14, color: "#334155" }}>Rango:</label>
                <select
                    value={monthsWindow}
                    onChange={(e) => setMonthsWindow(Number(e.target.value))}
                    disabled={loading}
                    style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #cbd5e1", background: "#fff" }}
                >
                    <option value={6}>Últimos 6 meses</option>
                    <option value={12}>Últimos 12 meses</option>
                </select>
                {loading && <span style={{ color: "#64748b", fontSize: 13 }}>Cargando…</span>}
                {error && <span style={{ color: "#dc2626", fontSize: 13 }}>Error: {error}</span>}
            </div>


            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                {kpiCards.map((k) => (
                    <KpiCard key={k.label} label={k.label} value={k.value} hint={k.hint} />
                ))}
            </div>


            {/* Gráficos principales */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <Card title="Evolución mensual: Facturas vs Ingresos">
                    {data ? <MonthlyLine data={data.monthly} /> : <div style={{ padding: 16 }}>Sin datos</div>}
                </Card>

                <Card title="KPIs por producto">
                    {data ? <ProductKpis rows={data.productKpis} /> : <div style={{ padding: 16 }}>Sin datos</div>}
                </Card>
            </div>


            {/* Sección inferior */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <Card title="Top 5 productos por cantidad">
                    {data ? <TopProductsBar data={data.top} /> : <div style={{ padding: 16 }}>Sin datos</div>}
                </Card>
                <Card title="Facturas por categoría (composición)">
                    {data ? <CategoryStackedArea data={data.stacked} /> : <div style={{ padding: 16 }}>Sin datos</div>}
                </Card>
            </div>
        </div>
    );
};


export default Estadisticas;
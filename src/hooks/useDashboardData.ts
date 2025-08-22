import { useEffect, useMemo, useState } from "react";
import { fetchDashboardData } from "../services/dashboard";
import { type DashboardData } from "../types/dashboard";

export function useDashboardData(monthsWindow: number) {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                setLoading(true);
                const res = await fetchDashboardData(monthsWindow);
                if (!cancelled) setData(res);
            } catch (e: any) {
                if (!cancelled) setError(e?.message || "No se pudo cargar");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [monthsWindow]);

    const kpis = useMemo(() => {
        if (!data) return null;
        const facturas = data.monthly.reduce((a, b) => a + (b.facturas || 0), 0);
        const ingresos = data.monthly.reduce((a, b) => a + (b.ingresos || 0), 0);
        const stock = data.productKpis.reduce((a, p) => a + (p.stock || 0), 0);
        return { facturas, ingresos, stock };
    }, [data]);

    return { data, kpis, loading, error };
}
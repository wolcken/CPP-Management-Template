import React, { useEffect, useMemo, useRef, useState } from "react";
import "../styles/pages/inventario.css";

import type { Producto } from "../services/types";
import { subscribeProductos } from "../services/productos";
import { getKardexCPP, type KardexResult, getInventarioResumen } from "../services/inventario";
import KardexModal from "../components/modals/KardexModal";
import { exportTablePdf } from "../utils/pdf/exportTablePdf";

// Firestore (para escuchar movimientos en vivo)
import { db } from "../lib/firebase";
import { collection, onSnapshot, query, orderBy, limit } from "firebase/firestore";

const Inventario: React.FC = () => {
    const [productos, setProductos] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);

    // Cache { [productoId]: { stock, cpp, valorizado } }
    const [invCache, setInvCache] = useState<Record<string, { stock: number; cpp: number; valorizado: number }>>({});
    const [invBusy, setInvBusy] = useState(false);
    const [invError, setInvError] = useState<string | null>(null);

    // 1) Suscripción a productos
    useEffect(() => {
        const unsub = subscribeProductos((rows) => {
            setProductos(rows);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // 2) CARGA INICIAL (reemplaza tu useEffect actual)
    const initialRunningRef = useRef(false);

    useEffect(() => {
        if (!productos.length) return;

        // Solo procesa los que aún no están en caché
        const pendingIds = productos.map(p => p.id).filter(id => !invCache[id]);
        if (pendingIds.length === 0) {
            // nada que hacer; asegúrate de no dejar "Actualizando…" encendido
            setInvBusy(false);
            return;
        }

        // evita reentradas si el efecto se dispara varias veces seguidas
        if (initialRunningRef.current) return;
        initialRunningRef.current = true;

        let cancelled = false;
        setInvBusy(true);
        setInvError(null);

        (async () => {
            try {
                for (const id of pendingIds) {
                    if (cancelled) break;
                    // ⛔️ clave: NO persistir en la carga inicial para no provocar updatedAt
                    const res = await getInventarioResumen(id, { forceRecalc: true, persist: false });
                    if (cancelled) break;
                    setInvCache(prev => ({ ...prev, [id]: res }));
                }
            } catch (e: any) {
                if (!cancelled) setInvError(e.message || "No se pudo calcular el inventario.");
            } finally {
                if (!cancelled) setInvBusy(false);
                initialRunningRef.current = false;
            }
        })();

        return () => { cancelled = true; };
    }, [productos, invCache]);

    // 3) Realtime: escuchar NUEVAS entradas/salidas y recalcular SOLO los productos afectados
    useEffect(() => {
        const entradasQ = query(collection(db, "entradas"), orderBy("createdAt", "desc"), limit(20));
        const salidasQ = query(collection(db, "salidas"), orderBy("createdAt", "desc"), limit(20));

        const unsubE = onSnapshot(entradasQ, (snap) => {
            snap.docChanges().forEach(async (ch) => {
                if (ch.type !== "added") return; // solo nuevos
                const pid = (ch.doc.data() as any)?.productoId;
                if (!pid) return;
                try {
                    const res = await getInventarioResumen(pid, { forceRecalc: true }); // 👈 clave
                    setInvCache((prev) => ({ ...prev, [pid]: res }));
                } catch {/* ignore */ }
            });
        });

        const unsubS = onSnapshot(salidasQ, (snap) => {
            snap.docChanges().forEach(async (ch) => {
                if (ch.type !== "added") return;
                const pid = (ch.doc.data() as any)?.productoId;
                if (!pid) return;
                try {
                    const res = await getInventarioResumen(pid, { forceRecalc: true }); // 👈 clave
                    setInvCache((prev) => ({ ...prev, [pid]: res }));
                } catch {/* ignore */ }
            });
        });

        return () => {
            unsubE();
            unsubS();
        };
    }, []);

    // ----- Modal Kárdex -----
    const [open, setOpen] = useState(false);
    const [productoNombre, setProductoNombre] = useState("");
    const [resultado, setResultado] = useState<KardexResult | null>(null);

    const verKardex = async (p: Producto) => {
        setProductoNombre(p.nombre);
        setResultado(null);
        setOpen(true);
        try {
            const res = await getKardexCPP(p.id);
            setResultado(res);
        } catch (e: any) {
            alert(e.message || "No se pudo construir el kárdex");
            setOpen(false);
        }
    };

    // ----- PDF -----
    const columns = [
        { header: "Código", dataKey: "codigo" },
        { header: "Producto", dataKey: "nombre" },
        { header: "Stock", dataKey: "stock" },
        { header: "CPP", dataKey: "cpp" },
        { header: "Valorizado", dataKey: "valorizado" },
    ];

    const inventarioRows = useMemo(
        () =>
            (productos as any[]).map((p) => {
                const cache = invCache[p.id];
                const stock = Number((cache?.stock ?? p.stock) ?? 0);
                const cpp = Number((cache?.cpp ?? p.cpp) ?? 0);
                const valorizado = +((cache?.valorizado ?? stock * cpp)).toFixed(2);
                return {
                    codigo: p.sku ?? p.codigo ?? "—",
                    nombre: p.nombre ?? "—",
                    stock,
                    cpp,
                    valorizado,
                };
            }),
        [productos, invCache]
    );

    const handleExport = () => {
        exportTablePdf({
            title: "Inventario",
            subtitle: "Reporte de existencias y valorización",
            columns,
            rows: inventarioRows,
            currencyFields: ["cpp", "valorizado"],
            fileName: "inventario",
            orientation: "l",
        });
    };

    return (
        <div className="inventario-page">
            <div className="toolbar">
                <h2>📦 Inventario</h2>
                <div className="actions">
                    {invBusy && <span className="updatedText">Actualizando…</span>}
                    <button onClick={handleExport} disabled={loading || productos.length === 0} className="btn">
                        Imprimir
                    </button>
                </div>
            </div>

            {loading ? (
                <p>Cargando...</p>
            ) : invError ? (
                <p className="warn">{invError}</p>
            ) : productos.length === 0 ? (
                <p>No hay productos registrados.</p>
            ) : (
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>Producto</th>
                                <th>Unidad</th>
                                <th>Estado</th>
                                <th className="right">Stock</th>
                                <th className="right">CPP</th>
                                <th className="right">Valorizado</th>
                                <th style={{ width: 150 }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(productos as any[]).map((p) => {
                                const cache = invCache[p.id];
                                const stock = Number((cache?.stock ?? p.stock) ?? 0);
                                const cpp = Number((cache?.cpp ?? p.cpp) ?? 0);
                                const valo = +((cache?.valorizado ?? stock * cpp)).toFixed(2);
                                return (
                                    <tr key={p.id}>
                                        <td>{p.sku || "—"}</td>
                                        <td>{p.nombre}</td>
                                        <td>{p.unidad || "—"}</td>
                                        <td>{p.activo === false ? "Inactivo" : "Activo"}</td>
                                        <td className="right">{stock}</td>
                                        <td className="right">{cpp.toFixed(2)}</td>
                                        <td className="right">{valo.toFixed(2)}</td>
                                        <td className="actions">
                                            <button className="btn" onClick={() => verKardex(p)}>📊 Ver</button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            <KardexModal
                open={open}
                onClose={() => setOpen(false)}
                productoNombre={productoNombre}
                resultado={resultado}
            />
        </div>
    );
};

export default Inventario;
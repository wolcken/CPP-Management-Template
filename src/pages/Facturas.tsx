import React, { useEffect, useMemo, useState } from "react";
import "../styles/pages/facturas.css";

import type { Producto, FacturaItem, FacturaInput } from "../services/types";
import { subscribeProductos } from "../services/productos";
import { createFactura, reserveNextFacturaNumber } from "../services/facturas";
import { getInventarioResumen } from "../services/inventario";

import { useNavigate } from "react-router-dom";

const currency = new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" });

const Facturas: React.FC = () => {
    //Navegar
    const navigate = useNavigate();

    // Cabecera
    const [numero, setNumero] = useState("");
    const [fecha, setFecha] = useState<string>(() => new Date().toISOString().slice(0, 10));
    const [clienteNombre, setClienteNombre] = useState("");
    const [clienteNIT, setClienteNIT] = useState("");

    // Productos
    const [productos, setProductos] = useState<Producto[]>([]);
    useEffect(() => {
        const unsub = subscribeProductos(setProductos);
        return () => unsub();
    }, []);

    // Cache de inventario por producto { stock, cpp }
    const [invCache, setInvCache] = useState<Record<string, { stock: number; cpp: number }>>({});
    const [invLoading, setInvLoading] = useState(false);
    const [invError, setInvError] = useState("");

    // Form de item
    const [productoId, setProductoId] = useState("");
    const [cantidad, setCantidad] = useState<number | string>("");
    const [precio, setPrecio] = useState<number | string>(""); // será CPP (read-only)

    const selected = useMemo(() => productos.find((p) => p.id === productoId), [productos, productoId]);

    // Cargar resumen (stock/cpp) cuando se elige producto
    useEffect(() => {
        (async () => {
            setInvError("");
            if (!productoId) { setPrecio(""); return; }
            if (invCache[productoId]) {
                setPrecio(Number(invCache[productoId].cpp.toFixed(2)));
                return;
            }
            try {
                setInvLoading(true);
                const res = await getInventarioResumen(productoId);
                setInvCache((prev) => ({ ...prev, [productoId]: { stock: res.stock, cpp: res.cpp } }));
                setPrecio(Number(res.cpp.toFixed(2)));
            } catch (e: any) {
                setInvError(e.message || "No se pudo calcular el CPP/stock");
            } finally {
                setInvLoading(false);
            }
        })();
    }, [productoId]);

    // Carrito/ítems
    const [items, setItems] = useState<FacturaItem[]>([]);

    const totalItem = useMemo(() => {
        const q = Number(cantidad) || 0;
        const pr = Number(precio) || 0;
        return +(q * pr).toFixed(2);
    }, [cantidad, precio]);

    const subtotal = useMemo(
        () => +(items.reduce((acc, it) => acc + it.total, 0).toFixed(2)),
        [items]
    );

    // Stock disponible considerando lo ya agregado de ese mismo producto
    const enCarrito = useMemo(
        () => items.filter((x) => x.productoId === productoId).reduce((a, b) => a + b.cantidad, 0),
        [items, productoId]
    );
    const disponible = useMemo(() => {
        const stock = invCache[productoId]?.stock ?? 0;
        return stock - enCarrito;
    }, [invCache, productoId, enCarrito]);

    const cppActual = invCache[productoId]?.cpp ?? 0;

    // Reglas para permitir Agregar
    const canAdd = useMemo(() => {
        const q = Number(cantidad);
        const pr = Number(precio);
        if (!selected) return false;
        if (invLoading || invError) return false;
        if (!Number.isFinite(cppActual) || cppActual <= 0) return false; // sin CPP aún -> no vender
        if (!q || q <= 0) return false;
        if (q > disponible) return false; // sin stock suficiente
        return pr > 0; // pr = CPP
    }, [selected, cantidad, precio, invLoading, invError, disponible, cppActual]);

    const addItem = () => {
        if (!canAdd || !selected) return;

        const nuevo: FacturaItem = {
            productoId: selected.id,
            nombre: selected.nombre,
            sku: (selected as any).sku,
            unidad: (selected as any).unidad,
            cantidad: Number(cantidad),
            precioUnitario: Number(precio), // CPP
            total: totalItem,
        };

        // Acumula por (producto + precio)
        const idx = items.findIndex(
            (x) => x.productoId === nuevo.productoId && x.precioUnitario === nuevo.precioUnitario
        );
        if (idx >= 0) {
            const copy = [...items];
            const merged = { ...copy[idx] };
            const nuevoTotalQty = merged.cantidad + nuevo.cantidad;
            if (nuevoTotalQty > (invCache[nuevo.productoId]?.stock ?? 0)) {
                alert("Stock insuficiente para acumular esta cantidad.");
                return;
            }
            merged.cantidad = nuevoTotalQty;
            merged.total = +(merged.cantidad * merged.precioUnitario).toFixed(2);
            copy[idx] = merged;
            setItems(copy);
        } else {
            setItems((prev) => [...prev, nuevo]);
        }

        // reset parciales
        setCantidad("");
        // precio queda con CPP del producto para facilitar agregar otra línea
    };

    const removeItem = (i: number) => {
        setItems((prev) => prev.filter((_, idx) => idx !== i));
    };

    const onAutoNumber = async () => {
        try {
            const n = await reserveNextFacturaNumber();
            setNumero(n);
        } catch {
            alert("No se pudo obtener el siguiente número. Puedes escribirlo manualmente.");
        }
    };

    // Revalidar stock antes de guardar (por si se movió)
    const validarStockAntesDeGuardar = async () => {
        const totalesPorProducto = items.reduce<Record<string, number>>((acc, it) => {
            acc[it.productoId] = (acc[it.productoId] || 0) + it.cantidad;
            return acc;
        }, {});
        for (const [pid, qty] of Object.entries(totalesPorProducto)) {
            const res = await getInventarioResumen(pid);
            if (qty > res.stock) {
                const prod = productos.find((p) => p.id === pid)?.nombre || pid;
                throw new Error(`Stock insuficiente para "${prod}". Disponible: ${res.stock}, solicitado: ${qty}.`);
            }
        }
    };

    const onSave = async () => {
        try {
            if (!numero.trim()) return alert("Ingrese el número de factura.");
            if (!fecha) return alert("Seleccione la fecha.");
            if (items.length === 0) return alert("Agregue al menos un producto.");

            await validarStockAntesDeGuardar();

            const payload: FacturaInput = {
                numero: numero.trim(),
                fecha,
                clienteNombre: clienteNombre.trim() || undefined,
                clienteNIT: clienteNIT.trim() || undefined,
                items,
                subtotal,
            };

            await createFactura(payload);

            // ✅ redirige a Salidas y manda un mensajito opcional
            navigate("/salidas", {
                replace: true,                // opcional: no deja volver al formulario con "Atrás"
                state: { msg: `Factura ${numero} guardada correctamente.` }
            });

            // reset
            setNumero("");
            setFecha(new Date().toISOString().slice(0, 10));
            setClienteNombre("");
            setClienteNIT("");
            setItems([]);
            setInvCache({});
            alert("Factura guardada correctamente.");
        } catch (e: any) {
            alert(e.message || "No se pudo guardar la factura");
        }
    };

    return (
        <div className="facturas-page">
            <h2 className="title">Generación de Factura</h2>

            {/* Cabecera */}
            <div className="grid-2 gap">
                <div className="input-group">
                    <label>No. Factura</label>
                    <div className="inline">
                        <input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="000001" />
                        <button className="btn" onClick={onAutoNumber} title="Autonumerar">Auto</button>
                    </div>
                </div>

                <div className="input-group">
                    <label>Fecha</label>
                    <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
                </div>

                <div className="input-group">
                    <label>Nombre</label>
                    <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Cliente" />
                </div>

                <div className="input-group">
                    <label>NIT</label>
                    <input value={clienteNIT} onChange={(e) => setClienteNIT(e.target.value)} placeholder="NIT/CI" />
                </div>
            </div>

            {/* Agregar productos */}
            <h3 className="section-title">Agregar Productos</h3>
            <div className="grid-4 gap add-row">
                <div className="input-group">
                    <label>Producto</label>
                    <select value={productoId} onChange={(e) => setProductoId(e.target.value)}>
                        <option value="">Seleccione un producto</option>
                        {productos.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.nombre} {(p as any).sku ? `· ${(p as any).sku}` : ""}
                            </option>
                        ))}
                    </select>

                    {/* Badges de stock/cpp */}
                    {productoId && (
                        <div className="badge-row">
                            {invLoading ? (
                                <span className="badge">Calculando stock/CPP…</span>
                            ) : invError ? (
                                <span className="badge warn">{invError}</span>
                            ) : (
                                <>
                                    <span className="badge">Stock disp.: {Math.max(0, disponible)}</span>
                                    <span className="badge">CPP: {currency.format(cppActual || 0)}</span>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="input-group">
                    <label>Cantidad</label>
                    <input
                        type="number"
                        step="1"
                        min="0"
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        placeholder="Cantidad"
                    />
                    {!!productoId && Number(cantidad) > disponible && (
                        <small className="warn-text">⚠ Sin stock suficiente. Disponible: {Math.max(0, disponible)}.</small>
                    )}
                </div>

                <div className="input-group">
                    <label>Precio (CPP)</label>
                    <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={precio}
                        readOnly
                    />
                </div>

                <div className="input-group total-readonly">
                    <label>Total</label>
                    <input value={totalItem || 0} readOnly />
                </div>

                <div className="input-group full">
                    <button className="btn-primary" onClick={addItem} disabled={!canAdd}>
                        Agregar
                    </button>
                </div>
            </div>

            {/* Lista */}
            <h3 className="section-title">Lista de Productos</h3>
            <div className="table-wrap">
                <table className="table">
                    <thead>
                        <tr>
                            <th>Código</th>
                            <th>Detalle</th>
                            <th>Precio (CPP)</th>
                            <th>Unidades</th>
                            <th>Total</th>
                            <th style={{ width: 110 }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.length === 0 ? (
                            <tr><td colSpan={6} className="muted">Sin productos</td></tr>
                        ) : (
                            items.map((it, i) => (
                                <tr key={`${it.productoId}-${i}`}>
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
                                    <td className="actions">
                                        <button className="btn-danger" onClick={() => removeItem(i)}>🗑 Eliminar</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={4} className="right bold">Subtotal:</td>
                            <td colSpan={2} className="bold">{currency.format(subtotal)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            <div className="footer-actions">
                <button className="btn-success" onClick={onSave} disabled={!numero || !fecha || items.length === 0}>
                    Guardar Factura
                </button>
            </div>
        </div>
    );
};

export default Facturas;
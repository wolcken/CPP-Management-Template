export function round2(n: number) {
    return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function calcEntrada(prevStock: number, prevCpp: number, cant: number, costoUnit: number) {
    const stockNuevo = prevStock + cant;
    const cppNuevo = stockNuevo === 0
        ? 0
        : (prevStock * prevCpp + cant * costoUnit) / stockNuevo;
    const cpp2 = round2(cppNuevo);
    return { stock: stockNuevo, cpp: cpp2, valorizado: round2(stockNuevo * cpp2) };
}

export function calcSalida(prevStock: number, prevCpp: number, cant: number) {
    if (cant > prevStock) throw new Error("Stock insuficiente");
    const stockNuevo = prevStock - cant;
    const cpp2 = round2(prevCpp); // no cambia en salidas
    return { stock: stockNuevo, cpp: cpp2, valorizado: round2(stockNuevo * cpp2) };
}
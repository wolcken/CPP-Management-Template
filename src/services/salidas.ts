import { collection, getDocs, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";

export type SalidaItem = {
    id: string;
    productoId: string;
    facturaId: string;
    cantidad: number;            // unidades vendidas
    precioUnitario: number;      // venta (no afecta CPP)
    fecha: any;                  // Timestamp
    createdAt?: any;             // Timestamp
};

const colRef = collection(db, "salidas");

// Salidas por producto (orden ascendente por fecha/createdAt)
export async function fetchSalidasByProducto(productoId: string): Promise<SalidaItem[]> {
    const q = query(
        colRef,
        where("productoId", "==", productoId),
        orderBy("fecha", "asc"),
        orderBy("createdAt", "asc")
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<SalidaItem, "id">) }));
}
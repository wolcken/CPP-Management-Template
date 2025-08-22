import { db } from "../lib/firebase";
import {
    addDoc, collection, deleteDoc, doc, getDocs, onSnapshot,
    orderBy, query, serverTimestamp, where, type Unsubscribe
} from "firebase/firestore";
import type { Proveedor } from "./types";

const COL = "proveedores";
const colRef = collection(db, COL);

const normalize = (s: string) => s.trim().toLowerCase();

export function subscribeProveedores(cb: (items: Proveedor[]) => void): Unsubscribe {
    const q = query(colRef, orderBy("nombre"));
    return onSnapshot(q, (snap) => {
        const rows: Proveedor[] = snap.docs.map((d) => {
            const data = d.data() as Omit<Proveedor, "id">;
            return { id: d.id, ...data };
        });
        cb(rows);
    });
}

export async function createProveedor(data: Omit<Proveedor, "id">): Promise<void> {
    const nombre = data.nombre?.trim() || "";
    if (!nombre) return;

    const existsQ = query(colRef, where("nombre_lc", "==", normalize(nombre)));
    const exists = await getDocs(existsQ);
    if (!exists.empty) throw new Error("El proveedor ya existe.");

    await addDoc(colRef, {
        ...data,
        nombre,
        nombre_lc: normalize(nombre),
        createdAt: serverTimestamp(),
    });
}

export async function deleteProveedor(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}
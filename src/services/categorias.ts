import { db } from "../lib/firebase";
import {
    addDoc, collection, deleteDoc, doc, getDocs, onSnapshot,
    orderBy, query, serverTimestamp, where, type Unsubscribe
} from "firebase/firestore";
import type { Categoria } from "./types";

const COL = "categorias";
const colRef = collection(db, COL);

const normalize = (s: string) => s.trim().toLowerCase();

export function subscribeCategorias(cb: (items: Categoria[]) => void): Unsubscribe {
    const q = query(colRef, orderBy("nombre"));
    return onSnapshot(q, (snap) => {
        const rows: Categoria[] = snap.docs.map((d) => ({
            id: d.id,
            nombre: (d.data().nombre as string) || "",
        }));
        cb(rows);
    });
}

export async function createCategoria(nombre: string): Promise<void> {
    const n = nombre.trim();
    if (!n) return;

    const existsQ = query(colRef, where("nombre_lc", "==", normalize(n)));
    const exists = await getDocs(existsQ);
    if (!exists.empty) throw new Error("La categoría ya existe.");

    await addDoc(colRef, { nombre: n, nombre_lc: normalize(n), createdAt: serverTimestamp() });
}

export async function deleteCategoria(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}
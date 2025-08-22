import { db } from "../lib/firebase";
import {
    addDoc, collection, deleteDoc, doc, getDocs, onSnapshot,
    orderBy, query, serverTimestamp, where, type Unsubscribe
} from "firebase/firestore";
import type { Marca } from "./types";

const COL = "marcas";
const colRef = collection(db, COL);

const normalize = (s: string) => s.trim().toLowerCase();

export function subscribeMarcas(cb: (items: Marca[]) => void): Unsubscribe {
    const q = query(colRef, orderBy("nombre"));
    return onSnapshot(q, (snap) => {
        const rows: Marca[] = snap.docs.map((d) => ({
            id: d.id,
            nombre: (d.data().nombre as string) || "",
        }));
        cb(rows);
    });
}

export async function createMarca(nombre: string): Promise<void> {
    const n = nombre.trim();
    if (!n) return;

    // evita duplicados por nombre (case-insensitive)
    const existsQ = query(colRef, where("nombre_lc", "==", normalize(n)));
    const exists = await getDocs(existsQ);
    if (!exists.empty) throw new Error("La marca ya existe.");

    await addDoc(colRef, { nombre: n, nombre_lc: normalize(n), createdAt: serverTimestamp() });
}

export async function deleteMarca(id: string): Promise<void> {
    await deleteDoc(doc(db, COL, id));
}
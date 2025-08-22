import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { type TopProduct } from "../../types/dashboard";


const fmtCurrency2 = (n?: number) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n || 0);
const fmtNumber2 = (n?: number) => new Intl.NumberFormat("es-BO").format(n || 0);


type PropsTop = { data: TopProduct[] };
export const TopProductsBar: React.FC<PropsTop> = ({ data }) => (
    <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 10, right: 22, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="producto" />
                <YAxis />
                <Tooltip formatter={(value: any, name) => (name === "ingresos" ? fmtCurrency2(value) : fmtNumber2(value))} />
                <Legend />
                <Bar dataKey="cantidad" name="Cantidad" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);
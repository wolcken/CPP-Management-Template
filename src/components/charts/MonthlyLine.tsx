import React from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { type MonthPoint } from "../../types/dashboard";


const fmtCurrency = (n?: number) => new Intl.NumberFormat("es-BO", { style: "currency", currency: "BOB" }).format(n || 0);
const fmtNumber = (n?: number) => new Intl.NumberFormat("es-BO").format(n || 0);


type Props = { data: MonthPoint[] };
export const MonthlyLine: React.FC<Props> = ({ data }) => (
    <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 22, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip formatter={(value: any, name) => (name === "ingresos" ? fmtCurrency(value) : fmtNumber(value))} />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="facturas" stroke="#2563eb" strokeWidth={2} dot={false} name="Facturas" />
                <Line yAxisId="right" type="monotone" dataKey="ingresos" stroke="#16a34a" strokeWidth={2} dot={false} name="Ingresos (BOB)" />
            </LineChart>
        </ResponsiveContainer>
    </div>
);
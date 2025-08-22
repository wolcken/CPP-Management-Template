import React from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { type CategoryPoint } from "../../types/dashboard";


type PropsCat = { data: CategoryPoint[] };
export const CategoryStackedArea: React.FC<PropsCat> = ({ data }) => (
    <div style={{ width: "100%", height: 280 }}>
        <ResponsiveContainer>
            <AreaChart data={data} margin={{ top: 10, right: 22, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="g3" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.6} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="Materia Prima" stackId="1" stroke="#16a34a" fill="url(#g1)" />
                <Area type="monotone" dataKey="Servicios" stackId="1" stroke="#2563eb" fill="url(#g2)" />
                <Area type="monotone" dataKey="Otros" stackId="1" stroke="#f97316" fill="url(#g3)" />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);
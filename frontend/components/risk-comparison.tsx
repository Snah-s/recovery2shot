"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface RiskComparisonProps {
  teams: Array<{ team_name: string; risk: number }>
}

export default function RiskComparison({ teams }: RiskComparisonProps) {
  const data = teams.map((t) => ({
    name: t.team_name,
    risk: Number.parseFloat((t.risk * 100).toFixed(1)),
  }))

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fill: "var(--foreground)", fontSize: 12 }} />
          <YAxis tick={{ fill: "var(--foreground)", fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--background)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--foreground)",
            }}
            formatter={(value) => `${value}%`}
          />
          <Bar dataKey="risk" fill="var(--accent)" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground mb-2">Riesgo Promedio por Equipo</p>
        <p>Comparativa de probabilidad de tiro rival en los próximos 15 segundos</p>
      </div>
    </div>
  )
}

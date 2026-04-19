'use client'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface Props { dates: string[]; drawdownSeries: number[] }

export default function DrawdownChart({ dates, drawdownSeries }: Props) {
  const data = drawdownSeries.map((v, i) => ({
    date: dates[i + 1] ?? String(i + 1),
    Drawdown: parseFloat((-v).toFixed(2)),
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <defs>
          <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#e74c3c" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#e74c3c" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#181f2e" />
        <XAxis dataKey="date" tick={{ fill: '#3a4a60', fontSize: 10 }}
          axisLine={{ stroke: '#181f2e' }} tickLine={false}
          interval={Math.floor(data.length / 6)} />
        <YAxis tick={{ fill: '#3a4a60', fontSize: 11 }} axisLine={{ stroke: '#181f2e' }}
          tickLine={false} tickFormatter={v => `${v}%`} />
        <Tooltip
          contentStyle={{ background: '#0d1117', border: '1px solid #1e2d44', borderRadius: 8, color: '#e8eaf0' }}
          formatter={(v: number) => [`${v}%`, 'Drawdown']}
          labelStyle={{ color: '#8a9ab8', fontSize: '0.78rem' }}
        />
        <ReferenceLine y={0} stroke="#1e2d44" />
        <Area type="monotone" dataKey="Drawdown" stroke="#e74c3c"
          strokeWidth={1.5} fill="url(#ddGrad)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

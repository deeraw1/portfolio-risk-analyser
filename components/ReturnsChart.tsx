'use client'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

const PALETTE = ['#a78bfa','#34d399','#f59e0b','#60a5fa','#f87171','#c084fc','#4ade80','#fb923c']

interface Props {
  dates: string[]
  tickers: string[]
  assetCumReturns: number[][]
  portfolioCumReturns: number[]
}

export default function ReturnsChart({ dates, tickers, assetCumReturns, portfolioCumReturns }: Props) {
  const data = portfolioCumReturns.map((pv, i) => {
    const pt: Record<string, string | number> = {
      date: dates[i + 1] ?? String(i + 1),
      Portfolio: parseFloat(pv.toFixed(2)),
    }
    tickers.forEach((t, ti) => { pt[t] = parseFloat((assetCumReturns[ti][i] ?? 0).toFixed(2)) })
    return pt
  })

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#181f2e" />
        <XAxis dataKey="date" tick={{ fill: '#3a4a60', fontSize: 10 }}
          axisLine={{ stroke: '#181f2e' }} tickLine={false}
          interval={Math.floor(data.length / 6)} />
        <YAxis tick={{ fill: '#3a4a60', fontSize: 11 }} axisLine={{ stroke: '#181f2e' }}
          tickLine={false} tickFormatter={v => `${v}%`} />
        <Tooltip
          contentStyle={{ background: '#0d1117', border: '1px solid #1e2d44', borderRadius: 8, color: '#e8eaf0' }}
          formatter={(v: number) => [`${v}%`]}
          labelStyle={{ color: '#8a9ab8', fontSize: '0.78rem' }}
        />
        <Legend wrapperStyle={{ color: '#8a9ab8', fontSize: '0.8rem', paddingTop: 8 }} />
        <ReferenceLine y={0} stroke="#1e2d44" strokeDasharray="4 3" />
        {tickers.map((t, i) => (
          <Line key={t} type="monotone" dataKey={t} stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={1.5} dot={false} opacity={0.7} />
        ))}
        <Line type="monotone" dataKey="Portfolio" stroke="#ffffff"
          strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}

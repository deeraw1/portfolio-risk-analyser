'use client'

interface Props { tickers: string[]; matrix: number[][] }

function cellColor(v: number): string {
  // -1 → red, 0 → neutral, 1 → purple
  if (v >= 0.7)  return 'rgba(124,58,237,0.55)'
  if (v >= 0.4)  return 'rgba(124,58,237,0.28)'
  if (v >= 0.1)  return 'rgba(124,58,237,0.10)'
  if (v >= -0.1) return 'rgba(255,255,255,0.04)'
  if (v >= -0.4) return 'rgba(231,76,60,0.12)'
  return             'rgba(231,76,60,0.30)'
}

function textColor(v: number): string {
  if (Math.abs(v) >= 0.4) return '#e8eaf0'
  return '#8a9ab8'
}

export default function CorrelationHeatmap({ tickers, matrix }: Props) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: '0.82rem' }}>
        <thead>
          <tr>
            <th style={{ padding: '8px 12px', color: 'var(--muted)', fontWeight: 600,
              fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: 0.8,
              borderBottom: '1px solid var(--border2)', minWidth: 90 }} />
            {tickers.map(t => (
              <th key={t} style={{ padding: '8px 14px', color: 'var(--accent2)',
                fontWeight: 700, fontSize: '0.78rem', borderBottom: '1px solid var(--border2)',
                textAlign: 'center', minWidth: 80 }}>
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {tickers.map((row, i) => (
            <tr key={row}>
              <td style={{ padding: '8px 12px', color: 'var(--accent2)', fontWeight: 700,
                fontSize: '0.78rem', borderRight: '1px solid var(--border2)',
                whiteSpace: 'nowrap' }}>
                {row}
              </td>
              {matrix[i].map((v, j) => (
                <td key={j} style={{
                  padding: '10px 14px', textAlign: 'center', fontWeight: 600,
                  background: cellColor(v), color: textColor(v),
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  fontFamily: 'monospace',
                }}>
                  {i === j ? '—' : v.toFixed(2)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div style={{ marginTop: 12, display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--muted)' }}>
        {[
          { color: 'rgba(124,58,237,0.55)', label: 'High positive (≥ 0.7)' },
          { color: 'rgba(124,58,237,0.28)', label: 'Moderate (0.4–0.7)' },
          { color: 'rgba(255,255,255,0.04)', label: 'Low / none' },
          { color: 'rgba(231,76,60,0.30)',  label: 'Negative (diversifying)' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, background: color, border: '1px solid rgba(255,255,255,0.1)' }} />
            {label}
          </div>
        ))}
      </div>
    </div>
  )
}

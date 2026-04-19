'use client'
import { useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Papa from 'papaparse'
import type { AnalyseResponse } from '@/lib/types'

const ReturnsChart      = dynamic(() => import('./ReturnsChart'),      { ssr: false })
const DrawdownChart     = dynamic(() => import('./DrawdownChart'),     { ssr: false })
const CorrelationHeatmap = dynamic(() => import('./CorrelationHeatmap'), { ssr: false })

const ACCENT  = '#a78bfa'
const PALETTE = ['#a78bfa','#34d399','#f59e0b','#60a5fa','#f87171','#c084fc','#4ade80','#fb923c']

const pct  = (n: number, d = 2) => `${n >= 0 ? '+' : ''}${n.toFixed(d)}%`
const num  = (n: number, d = 2) => n.toFixed(d)

function KV({ k, v, color }: { k: string; v: string; color?: string }) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
      padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
      <span style={{ color:'var(--muted)', fontSize:'0.86rem' }}>{k}</span>
      <span style={{ fontWeight:600, color: color ?? 'var(--text)', fontSize:'0.9rem' }}>{v}</span>
    </div>
  )
}

function MetricCard({ label, value, sub, color, highlight }:
  { label:string; value:string; sub:string; color:string; highlight?:boolean }) {
  return (
    <div style={{
      background: highlight ? 'linear-gradient(135deg,#12073a,#1e0e5c)' : 'var(--surface)',
      border: `${highlight?'2px':'1px'} solid ${highlight?color:'var(--border)'}`,
      borderRadius:12, padding:'18px 14px', textAlign:'center',
    }}>
      <div style={{ fontSize:'0.66rem', fontWeight:700, letterSpacing:'1.2px',
        textTransform:'uppercase', color, marginBottom:7 }}>{label}</div>
      <div style={{ fontSize: highlight?'1.85rem':'1.45rem', fontWeight:800,
        color: highlight?'#fff':'var(--text)', lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:'0.72rem', color, marginTop:5 }}>{sub}</div>
    </div>
  )
}

const SAMPLE_CSV = `Date,DANGCEM,GTCO,MTNN,SEPLAT
2023-01-03,220.5,27.2,180.0,890.0
2023-01-04,218.0,27.8,182.5,895.0
2023-01-05,222.0,28.1,179.0,888.0
2023-01-09,219.5,27.5,183.0,902.0
2023-01-10,224.0,28.4,185.5,910.0
2023-01-11,221.0,28.0,184.0,905.0
2023-01-12,226.0,29.1,187.0,918.0
2023-01-13,224.5,28.7,186.5,912.0
2023-01-16,228.0,29.4,189.0,925.0
2023-01-17,230.0,30.0,191.0,930.0`

export default function PortfolioApp() {
  const [file,       setFile]       = useState<File | null>(null)
  const [dragging,   setDragging]   = useState(false)
  const [tickers,    setTickers]    = useState<string[]>([])
  const [weights,    setWeights]    = useState<number[]>([])
  const [rfr,        setRfr]        = useState('18')
  const [rowCount,   setRowCount]   = useState(0)
  const [result,     setResult]     = useState<AnalyseResponse | null>(null)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const loadFile = useCallback((f: File) => {
    setFile(f); setResult(null); setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const text   = e.target?.result as string
      const parsed = Papa.parse<Record<string,string>>(text, { header:true, skipEmptyLines:true })
      const fields = parsed.meta.fields ?? []
      const cols   = fields.slice(1)  // drop date column
      setTickers(cols)
      const eq = parseFloat((100 / cols.length).toFixed(2))
      setWeights(cols.map(() => eq))
      setRowCount(parsed.data.length)
    }
    reader.readAsText(f)
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    const f = e.dataTransfer.files?.[0]; if (f) loadFile(f)
  }

  const weightSum = weights.reduce((a,b)=>a+b,0)
  const weightOk  = Math.abs(weightSum - 100) < 0.5

  async function handleAnalyse() {
    if (!file || !weightOk) return
    setLoading(true); setError('')
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('weights', JSON.stringify(weights.map(w => w / 100)))
      form.append('rfr', rfr)
      const res  = await fetch('/api/analyse', { method:'POST', body:form })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setResult(data)
      setTimeout(() => document.getElementById('results')?.scrollIntoView({ behavior:'smooth' }), 100)
    } catch(e: unknown) {
      setError(e instanceof Error ? e.message : String(e))
    } finally { setLoading(false) }
  }

  function loadSample() {
    const blob = new Blob([SAMPLE_CSV], { type:'text/csv' })
    const f = new File([blob], 'sample_portfolio.csv', { type:'text/csv' })
    loadFile(f)
  }

  const inputSt: React.CSSProperties = {
    background:'var(--surface2)', border:'1px solid var(--border2)', borderRadius:8,
    color:'var(--text)', padding:'8px 10px', fontSize:'0.88rem', width:'100%', outline:'none',
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', padding:'32px 16px' }}>
      <div style={{ maxWidth:1060, margin:'0 auto' }}>

        {/* ── Hero ── */}
        <div style={{
          background:'linear-gradient(135deg,#0e0720 0%,#1a0e4a 55%,#2d1576 100%)',
          borderRadius:16, padding:'48px 52px', marginBottom:36, position:'relative', overflow:'hidden',
        }}>
          <div style={{ position:'absolute', right:40, top:-10, fontSize:180,
            opacity:0.05, color:'#fff', lineHeight:1, userSelect:'none', pointerEvents:'none' }}>◈</div>
          <h1 style={{ fontSize:'2.1rem', fontWeight:800, color:'#fff', marginBottom:8 }}>
            Portfolio Risk Analyser
          </h1>
          <p style={{ color:'#b8a4f0', fontSize:'1rem', maxWidth:560 }}>
            Upload a price series CSV. Get Sharpe ratio, VaR, Max Drawdown, correlation matrix,
            and a full risk breakdown — instantly.
          </p>
          <div style={{ marginTop:20, display:'flex', gap:8, flexWrap:'wrap' }}>
            {["Sharpe Ratio","Value at Risk","Max Drawdown","Correlation Matrix","Cumulative Returns","Risk Score"].map(t => (
              <span key={t} className="tag">{t}</span>
            ))}
          </div>
        </div>

        {/* ── Step 01 ── */}
        <div className="section-label">Step 01</div>
        <div className="section-title">Upload Price Series CSV</div>

        <div
          onClick={() => fileRef.current?.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          style={{
            background: dragging ? '#110a2a' : 'var(--surface)',
            border: `2px dashed ${dragging ? ACCENT : 'var(--border2)'}`,
            borderRadius:14, padding:'40px 24px', textAlign:'center',
            cursor:'pointer', transition:'all 0.2s', marginBottom:12,
          }}
        >
          <input ref={fileRef} type="file" accept=".csv"
            onChange={e => { const f=e.target.files?.[0]; if(f) loadFile(f) }}
            style={{ display:'none' }} />
          {file ? (
            <>
              <div style={{ color:'var(--text)', fontWeight:700, fontSize:'0.95rem', marginBottom:4 }}>{file.name}</div>
              <div style={{ color:'var(--faint)', fontSize:'0.8rem' }}>
                {rowCount.toLocaleString()} rows · {(file.size/1024).toFixed(1)} KB · click to replace
              </div>
            </>
          ) : (
            <>
              <div style={{ color:'var(--muted)', fontWeight:600, marginBottom:6 }}>
                Click to browse or drag CSV here
              </div>
              <div style={{ color:'var(--faint)', fontSize:'0.8rem' }}>
                First column = Date · Remaining columns = asset prices (one per asset)
              </div>
            </>
          )}
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:32 }}>
          <button onClick={loadSample}
            style={{ background:'rgba(167,139,250,0.1)', color:ACCENT,
              border:'1px solid rgba(167,139,250,0.25)', borderRadius:8,
              padding:'7px 16px', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
            Load sample (NGX 4-stock)
          </button>
          <div style={{ color:'var(--faint)', fontSize:'0.76rem' }}>
            CSV format: <code style={{ color:'var(--muted)', fontFamily:'monospace' }}>Date, TICKER1, TICKER2, ...</code>
          </div>
        </div>

        {/* ── Step 02 — Weights ── */}
        {tickers.length > 0 && (
          <>
            <hr />
            <div className="section-label">Step 02</div>
            <div className="section-title">Set Portfolio Weights</div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(160px,1fr))', gap:14, marginBottom:16 }}>
              {tickers.map((t, i) => (
                <div key={t}>
                  <label className="field-label">
                    <span style={{ color: PALETTE[i % PALETTE.length] }}>■</span> {t}
                  </label>
                  <div style={{ position:'relative' }}>
                    <input style={inputSt} type="number" min="0" max="100" step="0.01"
                      value={weights[i] ?? 0}
                      onChange={e => {
                        const v = parseFloat(e.target.value) || 0
                        setWeights(w => w.map((x,idx)=> idx===i ? v : x))
                      }} />
                    <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                      color:'var(--muted)', fontSize:'0.8rem', pointerEvents:'none' }}>%</span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display:'flex', alignItems:'center', gap:20, marginBottom:8, flexWrap:'wrap' }}>
              <div style={{
                padding:'7px 14px', borderRadius:8, fontSize:'0.82rem', fontWeight:600,
                background: weightOk ? 'rgba(52,211,153,0.1)' : 'rgba(231,76,60,0.1)',
                border: `1px solid ${weightOk ? 'rgba(52,211,153,0.3)' : 'rgba(231,76,60,0.3)'}`,
                color: weightOk ? '#34d399' : '#f87171',
              }}>
                Total: {weightSum.toFixed(2)}% {weightOk ? '✓' : '— must equal 100%'}
              </div>
              <button onClick={() => {
                const eq = parseFloat((100/tickers.length).toFixed(2))
                setWeights(tickers.map(()=>eq))
              }} style={{ background:'rgba(167,139,250,0.1)', color:ACCENT,
                border:'1px solid rgba(167,139,250,0.25)', borderRadius:8,
                padding:'7px 14px', fontSize:'0.8rem', fontWeight:600, cursor:'pointer' }}>
                Equal weight
              </button>
            </div>

            {/* ── Step 03 — Parameters ── */}
            <hr />
            <div className="section-label">Step 03</div>
            <div className="section-title">Parameters</div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16, marginBottom:28 }}>
              <div>
                <label className="field-label">Risk-Free Rate (annual %)</label>
                <input style={inputSt} type="number" min="0" max="100" step="0.1"
                  value={rfr} onChange={e => setRfr(e.target.value)} />
                <div style={{ fontSize:'0.72rem', color:'var(--faint)', marginTop:4 }}>
                  Nigeria T-bill ≈ 18% (2025)
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background:'rgba(231,76,60,0.1)', border:'1px solid rgba(231,76,60,0.3)',
                borderRadius:8, padding:'11px 16px', color:'#f87171', fontSize:'0.85rem', marginBottom:16 }}>
                {error}
              </div>
            )}

            <button className="btn-primary" onClick={handleAnalyse}
              disabled={loading || !weightOk || !file}>
              {loading ? 'Analysing…' : 'Run Risk Analysis'}
            </button>
          </>
        )}

        {/* ── Results ── */}
        {result && (
          <div id="results">
            <hr />
            <div className="section-label">Results</div>
            <div className="section-title">Portfolio Risk Report</div>

            {/* Score + top metrics */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12, marginBottom:28 }}>
              <MetricCard label="Risk Score" value={`${result.score}/100`}
                sub={result.riskLabel} color={result.riskColor} highlight />
              <MetricCard label="Ann. Return"
                value={`${result.portfolio.annReturn >= 0 ? '+' : ''}${result.portfolio.annReturn}%`}
                sub="Annualised" color="#a78bfa" />
              <MetricCard label="Volatility"
                value={`${result.portfolio.annVol}%`}
                sub="Annualised" color="#a78bfa" />
              <MetricCard label="Sharpe Ratio"
                value={num(result.portfolio.sharpe, 2)}
                sub={result.portfolio.sharpe >= 1 ? 'Good' : result.portfolio.sharpe >= 0.5 ? 'Acceptable' : 'Poor'}
                color={result.portfolio.sharpe >= 1 ? '#34d399' : result.portfolio.sharpe >= 0.5 ? '#f59e0b' : '#f87171'} />
              <MetricCard label="Max Drawdown"
                value={`-${result.portfolio.maxDrawdown}%`}
                sub="Peak-to-trough" color="#f87171" />
            </div>

            {/* Portfolio detail */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
              <div className="card">
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:ACCENT,
                  textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>
                  Portfolio Summary
                </div>
                <KV k="Annualised Return"  v={pct(result.portfolio.annReturn)} color={result.portfolio.annReturn >= 0 ? '#34d399' : '#f87171'} />
                <KV k="Annualised Volatility" v={`${result.portfolio.annVol}%`} />
                <KV k="Sharpe Ratio"       v={num(result.portfolio.sharpe)} />
                <KV k="Max Drawdown"       v={`-${result.portfolio.maxDrawdown}%`} color="#f87171" />
                <KV k="VaR (95%, daily)"   v={`${result.portfolio.var95}%`} color="#f59e0b" />
                <KV k="VaR (99%, daily)"   v={`${result.portfolio.var99}%`} color="#f87171" />
              </div>
              <div className="card">
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:ACCENT,
                  textTransform:'uppercase', letterSpacing:1, marginBottom:14 }}>
                  Holdings
                </div>
                {result.assets.map((a, i) => (
                  <div key={a.ticker} style={{ display:'flex', justifyContent:'space-between',
                    alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <span style={{ width:8, height:8, borderRadius:'50%',
                        background: PALETTE[i%PALETTE.length], display:'inline-block' }} />
                      <span style={{ fontWeight:600, color:'var(--text)', fontSize:'0.88rem' }}>{a.ticker}</span>
                    </div>
                    <div style={{ display:'flex', gap:16, fontSize:'0.82rem' }}>
                      <span style={{ color:'var(--muted)' }}>{(a.weight*100).toFixed(1)}%</span>
                      <span style={{ color: a.annReturn >= 0 ? '#34d399' : '#f87171', fontWeight:600 }}>
                        {pct(a.annReturn)}
                      </span>
                      <span style={{ color:'var(--muted)' }}>σ {a.annVol}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Cumulative returns chart */}
            <hr />
            <div className="section-label">Analysis 01</div>
            <div className="section-title">Cumulative Returns</div>
            <p style={{ color:'var(--faint)', fontSize:'0.84rem', marginTop:-16, marginBottom:20 }}>
              {result.rowCount.toLocaleString()} trading days · white line = portfolio
            </p>
            <ReturnsChart
              dates={result.dates}
              tickers={result.tickers}
              assetCumReturns={result.assets.map(a => a.cumReturns)}
              portfolioCumReturns={result.portfolio.cumReturns}
            />

            {/* Drawdown chart */}
            <hr />
            <div className="section-label">Analysis 02</div>
            <div className="section-title">Portfolio Drawdown</div>
            <DrawdownChart dates={result.dates} drawdownSeries={result.portfolio.drawdownSeries} />

            {/* Per-asset table */}
            <hr />
            <div className="section-label">Analysis 03</div>
            <div className="section-title">Asset-Level Risk Metrics</div>
            <div style={{ overflowX:'auto' }}>
              <table className="htable" style={{ width:'100%', minWidth:680, whiteSpace:'nowrap' }}>
                <thead>
                  <tr>
                    {['Asset','Weight','Ann. Return','Volatility','Sharpe','Max DD','VaR 95%','VaR 99%'].map(h => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.assets.map((a, i) => (
                    <tr key={a.ticker}>
                      <td>
                        <span style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ width:8, height:8, borderRadius:'50%',
                            background:PALETTE[i%PALETTE.length], display:'inline-block' }} />
                          <strong>{a.ticker}</strong>
                        </span>
                      </td>
                      <td style={{ color:'var(--muted)' }}>{(a.weight*100).toFixed(1)}%</td>
                      <td style={{ color: a.annReturn >= 0 ? '#34d399' : '#f87171', fontWeight:600 }}>{pct(a.annReturn)}</td>
                      <td>{a.annVol}%</td>
                      <td style={{ color: a.sharpe >= 1 ? '#34d399' : a.sharpe >= 0.5 ? '#f59e0b' : '#f87171' }}>{num(a.sharpe)}</td>
                      <td style={{ color:'#f87171' }}>-{a.maxDrawdown}%</td>
                      <td style={{ color:'#f59e0b' }}>{a.var95}%</td>
                      <td style={{ color:'#f87171' }}>{a.var99}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Correlation heatmap */}
            {result.tickers.length > 1 && (
              <>
                <hr />
                <div className="section-label">Analysis 04</div>
                <div className="section-title">Correlation Matrix</div>
                <p style={{ color:'var(--faint)', fontSize:'0.84rem', marginTop:-16, marginBottom:20 }}>
                  Low / negative correlations = better diversification
                </p>
                <CorrelationHeatmap tickers={result.tickers} matrix={result.correlation} />
              </>
            )}

            {/* Disclaimer */}
            <div style={{ marginTop:36, padding:'13px 18px', background:'var(--surface)',
              borderLeft:'3px solid var(--border2)', borderRadius:'0 8px 8px 0',
              color:'var(--faint)', fontSize:'0.78rem' }}>
              <strong style={{ color:'var(--muted)' }}>Disclaimer:</strong> This tool provides
              quantitative indicators for informational purposes only. Past performance does not
              guarantee future results. All investment decisions should be made with professional advice.
            </div>
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{ marginTop:56, paddingTop:28, borderTop:'1px solid var(--border)',
          display:'flex', justifyContent:'space-between', alignItems:'center',
          flexWrap:'wrap', gap:16 }}>
          <div style={{ color:'var(--faint)', fontSize:'0.82rem', lineHeight:1.8 }}>
            <span style={{ color:'var(--muted)', fontWeight:700, fontSize:'0.85rem' }}>
              Muhammed Adediran
            </span><br/>
            Financial Data Analyst · Portfolio Risk · Quantitative Modelling
          </div>
          <a href="https://adediran.xyz/contact" target="_blank" rel="noreferrer"
            style={{ color:ACCENT, fontWeight:600, fontSize:'0.85rem',
              border:'1px solid rgba(124,58,237,0.3)', borderRadius:8,
              padding:'9px 20px', textDecoration:'none' }}>
            Get in touch
          </a>
        </div>

      </div>
    </div>
  )
}

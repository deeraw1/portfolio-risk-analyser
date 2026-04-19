import type { AssetStats, PortfolioStats } from './types'
import { dailyReturns, cumulativeReturns, portfolioReturns } from './returns'

// ── primitives ────────────────────────────────────────────────────────────────
function mean(arr: number[]) { return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0 }

function std(arr: number[]) {
  if (arr.length < 2) return 0
  const m = mean(arr)
  return Math.sqrt(arr.reduce((s,v)=>s+Math.pow(v-m,2),0)/arr.length)
}

function annReturn(returns: number[], ppy = 252) {
  if (!returns.length) return 0
  const cum = returns.reduce((a,r)=>a*(1+r),1)
  return Math.pow(cum, ppy/returns.length) - 1
}

function annVol(returns: number[], ppy = 252) { return std(returns) * Math.sqrt(ppy) }

function sharpe(returns: number[], rfr: number, ppy = 252) {
  const vol = annVol(returns, ppy)
  return vol === 0 ? 0 : (annReturn(returns, ppy) - rfr) / vol
}

function varHistorical(returns: number[], conf: number) {
  if (!returns.length) return 0
  const sorted = [...returns].sort((a,b)=>a-b)
  return sorted[Math.floor((1 - conf) * sorted.length)] ?? sorted[0]
}

function maxDD(prices: number[]) {
  let peak = prices[0], mdd = 0
  for (const p of prices) {
    if (p > peak) peak = p
    const dd = peak > 0 ? (peak - p) / peak : 0
    if (dd > mdd) mdd = dd
  }
  return mdd
}

function drawdownSeries(cumRet: number[]): number[] {
  let peak = 0
  return cumRet.map(v => {
    if (v > peak) peak = v
    return peak > -100 ? parseFloat((((peak - v) / (100 + peak)) * 100).toFixed(4)) : 0
  })
}

export function correlation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length)
  if (n < 2) return 0
  const mx = mean(x.slice(0,n)), my = mean(y.slice(0,n))
  const num = x.slice(0,n).reduce((s,xi,i)=>s+(xi-mx)*(y[i]-my),0)
  const den = Math.sqrt(
    x.slice(0,n).reduce((s,xi)=>s+Math.pow(xi-mx,2),0) *
    y.slice(0,n).reduce((s,yi)=>s+Math.pow(yi-my,2),0)
  )
  return den === 0 ? 1 : parseFloat((num/den).toFixed(4))
}

// ── score ─────────────────────────────────────────────────────────────────────
function riskScore(vol: number, sharpeVal: number, mdd: number, avgCorr: number) {
  const vScore  = Math.min(vol  / 0.40, 1) * 30   // 0–30
  const sScore  = Math.max(1 - (sharpeVal + 0.5) / 2, 0) * 25  // 0–25
  const dScore  = Math.min(mdd  / 0.50, 1) * 30   // 0–30
  const cScore  = Math.min(avgCorr, 1) * 15        // 0–15
  return Math.round(vScore + sScore + dScore + cScore)
}

function label(score: number): { riskLabel: string; riskColor: string } {
  if (score >= 70) return { riskLabel: 'High Risk',    riskColor: '#e74c3c' }
  if (score >= 40) return { riskLabel: 'Medium Risk',  riskColor: '#f39c12' }
  return               { riskLabel: 'Low Risk',     riskColor: '#17c082' }
}

// ── main ──────────────────────────────────────────────────────────────────────
export function analyse(
  priceMatrix: number[][],   // [assetIdx][dayIdx]
  tickers: string[],
  weights: number[],         // must sum to 1
  rfr: number,
  ppy = 252
) {
  const retMatrix = priceMatrix.map(p => dailyReturns(p))

  const assets: AssetStats[] = tickers.map((ticker, i) => {
    const ret = retMatrix[i]
    const cum = cumulativeReturns(ret)
    return {
      ticker,
      weight:      weights[i],
      annReturn:   parseFloat((annReturn(ret, ppy) * 100).toFixed(2)),
      annVol:      parseFloat((annVol(ret, ppy) * 100).toFixed(2)),
      sharpe:      parseFloat(sharpe(ret, rfr, ppy).toFixed(3)),
      maxDrawdown: parseFloat((maxDD(priceMatrix[i]) * 100).toFixed(2)),
      var95:       parseFloat((varHistorical(ret, 0.95) * 100).toFixed(3)),
      var99:       parseFloat((varHistorical(ret, 0.99) * 100).toFixed(3)),
      cumReturns:  cum,
    }
  })

  const portRet = portfolioReturns(retMatrix, weights)
  const portCum = cumulativeReturns(portRet)
  // reconstruct price-like series for drawdown
  let pv = 100
  const portPrices = [pv, ...portRet.map(r => { pv *= (1+r); return pv })]

  const portfolio: PortfolioStats = {
    annReturn:      parseFloat((annReturn(portRet, ppy) * 100).toFixed(2)),
    annVol:         parseFloat((annVol(portRet, ppy) * 100).toFixed(2)),
    sharpe:         parseFloat(sharpe(portRet, rfr, ppy).toFixed(3)),
    maxDrawdown:    parseFloat((maxDD(portPrices) * 100).toFixed(2)),
    var95:          parseFloat((varHistorical(portRet, 0.95) * 100).toFixed(3)),
    var99:          parseFloat((varHistorical(portRet, 0.99) * 100).toFixed(3)),
    cumReturns:     portCum,
    drawdownSeries: drawdownSeries(portCum),
  }

  // correlation matrix
  const corrMatrix = tickers.map((_, i) =>
    tickers.map((_, j) => correlation(retMatrix[i], retMatrix[j]))
  )
  const n = tickers.length
  const avgCorr = n > 1
    ? tickers.reduce((s,_,i) => s + tickers.reduce((ss,__,j) => i===j ? ss : ss+corrMatrix[i][j], 0), 0)
      / (n * (n - 1))
    : 1

  const score = riskScore(portfolio.annVol/100, portfolio.sharpe, portfolio.maxDrawdown/100, avgCorr)
  const { riskLabel, riskColor } = label(score)

  return { assets, portfolio, correlation: corrMatrix, score, riskLabel, riskColor }
}

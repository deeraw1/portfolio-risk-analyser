export function dailyReturns(prices: number[]): number[] {
  const out: number[] = []
  for (let i = 1; i < prices.length; i++) {
    const prev = prices[i - 1]
    out.push(prev !== 0 ? (prices[i] - prev) / prev : 0)
  }
  return out
}

export function cumulativeReturns(returns: number[]): number[] {
  let cum = 1
  return returns.map(r => { cum *= (1 + r); return parseFloat(((cum - 1) * 100).toFixed(4)) })
}

export function portfolioReturns(assetReturns: number[][], weights: number[]): number[] {
  const n = assetReturns[0]?.length ?? 0
  return Array.from({ length: n }, (_, t) =>
    assetReturns.reduce((s, ret, i) => s + (ret[t] ?? 0) * weights[i], 0)
  )
}

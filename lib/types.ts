export interface AssetStats {
  ticker:         string
  weight:         number
  annReturn:      number
  annVol:         number
  sharpe:         number
  maxDrawdown:    number
  var95:          number
  var99:          number
  cumReturns:     number[]
}

export interface PortfolioStats {
  annReturn:      number
  annVol:         number
  sharpe:         number
  maxDrawdown:    number
  var95:          number
  var99:          number
  cumReturns:     number[]
  drawdownSeries: number[]
}

export interface AnalyseResponse {
  dates:       string[]
  tickers:     string[]
  weights:     number[]
  assets:      AssetStats[]
  portfolio:   PortfolioStats
  correlation: number[][]   // n×n matrix
  score:       number
  riskLabel:   string
  riskColor:   string
  rowCount:    number
}

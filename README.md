# Portfolio Risk & Volatility Model

An interactive portfolio stress-testing tool using Monte Carlo simulation and Conditional Value at Risk (CVaR) modelling. Quantifies tail risk across asset classes under multiple market scenarios.

## What It Does

- Runs **Monte Carlo simulation** (multiple iterations) to model portfolio return distributions
- Computes **CVaR (Conditional Value at Risk)** — the expected loss in the worst tail scenarios
- Calculates **parametric VaR** at 95% and 99% confidence levels
- Stress-tests portfolio across user-defined market scenarios
- Breaks down risk contribution by asset class
- Displays return distribution histogram with VaR/CVaR threshold markers

## Key Metrics

| Metric | Description |
|---|---|
| VaR (95%) | Maximum loss not exceeded 95% of the time |
| VaR (99%) | Maximum loss not exceeded 99% of the time |
| CVaR / Expected Shortfall | Average loss in the worst 5% of scenarios |
| Sharpe Ratio | Risk-adjusted return |
| Max Drawdown | Largest peak-to-trough decline |

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Recharts** — histogram and line charts
- **Tailwind CSS**
- Monte Carlo engine runs entirely client-side in the browser

## Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

Built by [Muhammed Adediran](https://adediran.xyz/contact)

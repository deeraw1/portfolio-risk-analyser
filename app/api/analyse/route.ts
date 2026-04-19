import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { analyse } from '@/lib/risk'

export const runtime    = 'nodejs'
export const maxDuration = 30

export async function POST(req: NextRequest) {
  try {
    const form      = await req.formData()
    const file      = form.get('file') as File | null
    const weightsRaw = form.get('weights') as string | null
    const rfrRaw    = form.get('rfr') as string | null

    if (!file)        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    if (!weightsRaw)  return NextResponse.json({ error: 'Weights missing'  }, { status: 400 })

    const rfr     = parseFloat(rfrRaw ?? '0') / 100
    const weights: number[] = JSON.parse(weightsRaw)

    const text   = await file.text()
    const parsed = Papa.parse<Record<string,string>>(text, {
      header: true, skipEmptyLines: true,
    })

    const fields  = parsed.meta.fields ?? []
    if (fields.length < 2) return NextResponse.json({ error: 'CSV must have a date column and at least one price column' }, { status: 400 })

    const dateCol = fields[0]
    const tickers = fields.slice(1)

    if (weights.length !== tickers.length)
      return NextResponse.json({ error: `Weight count (${weights.length}) does not match asset count (${tickers.length})` }, { status: 400 })

    const rows   = parsed.data
    const dates  = rows.map(r => String(r[dateCol] ?? ''))

    // build price matrix [assetIdx][dayIdx]
    const priceMatrix: number[][] = tickers.map(t =>
      rows.map(r => parseFloat(String(r[t] ?? ''))).filter(v => !isNaN(v))
    )

    const minLen = Math.min(...priceMatrix.map(p => p.length))
    if (minLen < 10) return NextResponse.json({ error: 'Need at least 10 rows of price data' }, { status: 400 })

    const trimmed = priceMatrix.map(p => p.slice(0, minLen))

    // normalise weights to sum=1
    const wSum = weights.reduce((a,b)=>a+b,0)
    const normW = weights.map(w => w/wSum)

    const result = analyse(trimmed, tickers, normW, rfr)

    return NextResponse.json({
      ...result,
      dates:    dates.slice(0, minLen),
      tickers,
      weights:  normW,
      rowCount: minLen,
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

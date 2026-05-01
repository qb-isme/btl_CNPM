import { NextResponse } from 'next/server'
import { demoPromotionPercent, setDemoPromotionPercent } from '@/lib/parking-data'

export async function GET() {
  try {
    return NextResponse.json({ success: true, percent: demoPromotionPercent })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to read promotion' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const raw = body?.percent ?? body?.promotionPercent
    const percent = typeof raw === 'number' ? raw : Number.parseFloat(String(raw))
    if (Number.isNaN(percent)) {
      return NextResponse.json({ success: false, error: 'Invalid percent' }, { status: 400 })
    }
    setDemoPromotionPercent(percent)
    return NextResponse.json({ success: true, percent: demoPromotionPercent })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to update promotion' }, { status: 400 })
  }
}

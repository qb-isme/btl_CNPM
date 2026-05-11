import { NextRequest, NextResponse } from 'next/server';
import { demoPromotionPercent, setDemoPromotionPercent } from '@/lib/parking-data';

export async function GET() {
  return NextResponse.json({ success: true, percent: demoPromotionPercent });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const percent = Number(body.percent);
    if (Number.isNaN(percent) || percent < 0 || percent > 100) {
      return NextResponse.json({ success: false, message: 'Mức ưu đãi phải nằm trong khoảng 0-100.' }, { status: 400 });
    }

    setDemoPromotionPercent(percent);
    return NextResponse.json({ success: true, percent: Math.round(percent) });
  } catch {
    return NextResponse.json({ success: false, message: 'Không thể cập nhật mức ưu đãi.' }, { status: 500 });
  }
}

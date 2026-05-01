import { NextResponse } from 'next/server';
import { paymentController } from '@/lib/parking-data';

/** CD PaymentController: tổng hợp nợ + phiên chờ thanh toán (mock user cố định). */
export async function GET() {
  try {
    const info = paymentController.getDebtInfo('user-001');
    return NextResponse.json({ success: true, debtInfo: info });
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch debt info' }, { status: 500 });
  }
}

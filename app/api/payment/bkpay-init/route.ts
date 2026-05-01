import { NextResponse } from 'next/server';
import { paymentController } from '@/lib/parking-data';

/**
 * CD PaymentController.initiatePayment — trả về URL BKPay mock.
 * Thực tế client vẫn vào /payment; có thể dùng URL này để mô phỏng redirect.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId') ?? `BK-${Date.now()}`;
    const redirectUrl = paymentController.initiatePayment(transactionId);
    return NextResponse.json({ success: true, redirectUrl, transactionId });
  } catch {
    return NextResponse.json({ success: false, error: 'initiatePayment failed' }, { status: 500 });
  }
}

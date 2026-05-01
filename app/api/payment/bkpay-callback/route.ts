import { NextResponse } from 'next/server';
import { paymentController, syncUserAccountFromEntity } from '@/lib/parking-data';

/**
 * CD PaymentController.handleBKPayCallback — mock webhook BKPay.
 * Body JSON: { transactionId: string, status: 'Success' | 'Failed', sessionIds: string[] }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transactionId, status, sessionIds } = body as {
      transactionId?: string;
      status?: string;
      sessionIds?: string[];
    };

    if (!transactionId || !status) {
      return NextResponse.json({ success: false, message: 'Thiếu transactionId hoặc status' }, { status: 400 });
    }

    const ok = paymentController.handleBKPayCallback(transactionId, status);
    if (!ok || status !== 'Success') {
      return NextResponse.json({ success: false, message: 'Callback không hợp lệ hoặc thanh toán thất bại' }, { status: 400 });
    }

    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Thiếu sessionIds' }, { status: 400 });
    }

    const settle = paymentController.settleSessions(sessionIds);
    if (!settle.success) {
      return NextResponse.json({ success: false, message: settle.message }, { status: 400 });
    }

    syncUserAccountFromEntity();
    return NextResponse.json({ success: true, transactionCode: settle.transactionCode });
  } catch {
    return NextResponse.json({ success: false, message: 'Callback error' }, { status: 500 });
  }
}

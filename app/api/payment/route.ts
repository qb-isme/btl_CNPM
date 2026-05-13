import { NextRequest, NextResponse } from 'next/server';
import { processPayment } from '@/lib/parking-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const transactionIds = Array.isArray(body.transactionIds) ? body.transactionIds : [];
    const otp = String(body.otp ?? '').trim();

    if (!otp) {
      return NextResponse.json({ success: false, message: 'Vui lòng nhập mật khẩu xác nhận BKPay.' }, { status: 400 });
    }

    if (otp === '000000') {
      return NextResponse.json({ success: false, message: 'Mật khẩu không hợp lệ.' }, { status: 400 });
    }

    const result = processPayment(transactionIds);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch {
    return NextResponse.json({ success: false, message: 'Lỗi kết nối Cổng thanh toán BKPay.' }, { status: 500 });
  }
}

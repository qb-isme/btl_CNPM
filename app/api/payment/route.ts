import { NextResponse } from 'next/server';
import { processPayment, userAccount } from '@/lib/parking-data';

export async function POST(request: Request) {
  try {
    const { transactionIds, otp } = await request.json();
    
    if (!transactionIds || !Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Không có giao dịch nào được chọn.' },
        { status: 400 }
      );
    }
    
    if (!otp || otp !== '123456') {
      return NextResponse.json(
        { success: false, message: 'Mật khẩu không hợp lệ.' },
        { status: 400 }
      );
    }
    
    const result = processPayment(transactionIds);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      transactionCode: result.transactionCode,
      newBalance: userAccount.balance,
      newDebt: userAccount.totalDebt,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Đã xảy ra lỗi trong quá trình xử lý thanh toán.' },
      { status: 500 }
    );
  }
}

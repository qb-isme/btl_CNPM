import { NextRequest, NextResponse } from 'next/server';
import { getAllTransactionDtos, getPaidTransactions, getUnpaidTransactions, syncUserAccountFromEntity } from '@/lib/parking-data';

export async function GET(request: NextRequest) {
  try {
    syncUserAccountFromEntity();
    const status = request.nextUrl.searchParams.get('status');
    const transactions = status === 'paid'
      ? getPaidTransactions()
      : status === 'unpaid'
        ? getUnpaidTransactions()
        : getAllTransactionDtos();

    return NextResponse.json(
      { success: true, transactions },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0, must-revalidate' } },
    );
  } catch {
    return NextResponse.json({ success: false, message: 'Không thể tải danh sách giao dịch' }, { status: 500 });
  }
}

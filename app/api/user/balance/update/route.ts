import { NextRequest, NextResponse } from 'next/server';
import { syncUserAccountFromEntity, userAccount } from '@/lib/parking-data';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const balance = Number(body.balance);

    if (Number.isNaN(balance) || balance < 0) {
      return NextResponse.json({ success: false, message: 'Số dư không hợp lệ.' }, { status: 400 });
    }

    userAccount.balance = balance;
    syncUserAccountFromEntity();

    return NextResponse.json(
      { success: true, user: userAccount },
      { headers: { 'Cache-Control': 'private, no-store, max-age=0, must-revalidate' } },
    );
  } catch {
    return NextResponse.json({ success: false, message: 'Không thể cập nhật số dư.' }, { status: 500 });
  }
}

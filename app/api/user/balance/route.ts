import { NextResponse } from 'next/server';
import { syncUserAccountFromEntity, userAccount } from '@/lib/parking-data';

export async function GET() {
  try {
    syncUserAccountFromEntity();
    
    return NextResponse.json({
      success: true,
      user: userAccount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user balance' },
      { status: 500 }
    );
  }
}

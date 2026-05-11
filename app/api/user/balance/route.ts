import { NextResponse } from 'next/server';
import { syncUserAccountFromEntity, userAccount } from '@/lib/parking-data';

export async function GET() {
  try {
    syncUserAccountFromEntity();
    
    return NextResponse.json(
      {
        success: true,
        user: userAccount,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user balance' },
      { status: 500 }
    );
  }
}

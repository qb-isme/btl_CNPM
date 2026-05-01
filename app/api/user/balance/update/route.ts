import { NextResponse } from 'next/server';
import { syncUserAccountFromEntity, userAccountEntity, userAccount } from '@/lib/parking-data';

export async function POST(request: Request) {
  try {
    const { balance } = await request.json();
    
    if (typeof balance !== 'number' || balance < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid balance amount' },
        { status: 400 }
      );
    }
    
    // Update the balance in the entity
    userAccountEntity.balance = balance;
    
    // Sync the snapshot
    syncUserAccountFromEntity();
    
    return NextResponse.json({
      success: true,
      user: userAccount,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to update balance' },
      { status: 500 }
    );
  }
}

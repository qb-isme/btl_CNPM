import { NextResponse } from 'next/server';
import { getAllTransactionDtos, getUnpaidTransactions, getPaidTransactions } from '@/lib/parking-data';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let filteredTransactions = getAllTransactionDtos();
    
    if (status === 'paid') {
      filteredTransactions = getPaidTransactions();
    } else if (status === 'unpaid') {
      filteredTransactions = getUnpaidTransactions();
    }
    
    return NextResponse.json({ 
      success: true, 
      transactions: filteredTransactions 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' }, 
      { status: 500 }
    );
  }
}

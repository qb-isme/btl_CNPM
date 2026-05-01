import { NextResponse } from 'next/server';
import { generateReceiptForSessions } from '@/lib/parking-data';
import { receiptToPdfBuffer } from '@/lib/receipt-pdf';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const raw = searchParams.get('ids') ?? '';
    const sessionIds = raw.split(',').map((s) => s.trim()).filter(Boolean);

    if (sessionIds.length === 0) {
      return NextResponse.json({ success: false, message: 'Thiếu ids' }, { status: 400 });
    }

    const receipt = generateReceiptForSessions(sessionIds);
    if (!receipt) {
      return NextResponse.json({ success: false, message: 'Không tạo được biên lai' }, { status: 404 });
    }

    const buffer = await receiptToPdfBuffer(receipt);
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="bien-lai-bai-xe.pdf"',
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ success: false, error: 'Failed to build receipt PDF' }, { status: 500 });
  }
}
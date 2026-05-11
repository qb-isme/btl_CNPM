import { NextRequest, NextResponse } from 'next/server';
import { generateReceiptForSessions } from '@/lib/parking-data';

const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')}đ`;
const formatDateTime = (value: Date) => new Date(value).toLocaleString('vi-VN');

export async function GET(request: NextRequest) {
  const ids = request.nextUrl.searchParams.get('ids')?.split(',').map((id) => id.trim()).filter(Boolean) ?? [];
  const receipt = generateReceiptForSessions(ids);

  if (!receipt) {
    return NextResponse.json({ success: false, message: 'Không tìm thấy phiên đã thanh toán để xuất biên lai.' }, { status: 404 });
  }

  const rows = receipt.sessions.map((session) => `
    <tr>
      <td>${session.sessionNumber}</td>
      <td>${session.licensePlate}</td>
      <td>${formatDateTime(session.checkInTime)} - ${formatDateTime(session.checkOutTime)}</td>
      <td>${formatCurrency(session.finalFee)}</td>
    </tr>
  `).join('');

  const html = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <title>Biên lai BK-PARKING</title>
  <style>
    body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
    h1 { color: #0284C7; }
    table { width: 100%; border-collapse: collapse; margin-top: 24px; }
    th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: left; }
    th { background: #e0f2fe; }
    .total { margin-top: 24px; font-size: 20px; font-weight: 700; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <button onclick="window.print()">In / Lưu PDF</button>
  <h1>BK-PARKING - Biên lai thanh toán</h1>
  <p><strong>Mã biên lai:</strong> ${receipt.receiptCode}</p>
  <p><strong>Thời gian xuất:</strong> ${formatDateTime(receipt.generatedAt)}</p>
  <table>
    <thead><tr><th>Phiên</th><th>Biển số</th><th>Thời gian</th><th>Số tiền</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="total">Tổng tiền: ${formatCurrency(receipt.totalAmount)}</p>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
    },
  });
}

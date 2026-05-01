import fs from 'fs'
import path from 'path'
import fontkit from '@pdf-lib/fontkit'
import { PDFDocument, rgb } from 'pdf-lib'
import type { Receipt } from '@/lib/domain/receipt'

const FONT_REL = path.join('lib', 'fonts', 'Roboto-Regular.ttf')

/**
 * Biên lai PDF: Phiên thứ tự, Thời gian (vào / ra), Biển số, Mức phí.
 * Font Roboto hỗ trợ tiếng Việt — đặt tại lib/fonts/Roboto-Regular.ttf
 */
export async function receiptToPdfBuffer(receipt: Receipt): Promise<Buffer> {
  const fontPath = path.join(process.cwd(), FONT_REL)
  if (!fs.existsSync(fontPath)) {
    throw new Error(
      'Thiếu file font Roboto: lib/fonts/Roboto-Regular.ttf (tải từ googlefonts/roboto hoặc sao chép vào thư mục này).',
    )
  }

  const pdfDoc = await PDFDocument.create()
  pdfDoc.registerFontkit(fontkit)
  const font = await pdfDoc.embedFont(fs.readFileSync(fontPath), { subset: true })

  const page = pdfDoc.addPage([595.28, 841.89])
  const pageW = page.getWidth()
  const pageH = page.getHeight()
  const margin = 48
  let y = pageH - margin

  page.drawText('BIÊN LAI THANH TOÁN BÃI XE', {
    x: margin,
    y,
    size: 15,
    font,
    color: rgb(0.12, 0.18, 0.28),
  })
  y -= 36

  const col = { session: margin, time: margin + 76, plate: margin + 222, fee: margin + 332 }
  const sizeHeader = 10
  const sizeBody = 9

  page.drawText('Phiên thứ tự', { x: col.session, y, size: sizeHeader, font, color: rgb(0.15, 0.2, 0.35) })
  page.drawText('Thời gian', { x: col.time, y, size: sizeHeader, font, color: rgb(0.15, 0.2, 0.35) })
  page.drawText('Biển số', { x: col.plate, y, size: sizeHeader, font, color: rgb(0.15, 0.2, 0.35) })
  page.drawText('Mức phí', { x: col.fee, y, size: sizeHeader, font, color: rgb(0.15, 0.2, 0.35) })
  y -= 6
  page.drawRectangle({
    x: margin,
    y: y - 1,
    width: pageW - 2 * margin,
    height: 1,
    color: rgb(0.78, 0.8, 0.85),
  })
  y -= 24

  for (const line of receipt.lines) {
    page.drawText(String(line.sessionNumber), { x: col.session, y, size: sizeBody, font, color: rgb(0.1, 0.12, 0.16) })

    const timeParts = line.timeText.split('\n').filter(Boolean)
    page.drawText(timeParts[0] ?? '', { x: col.time, y, size: 8, font, color: rgb(0.1, 0.12, 0.16) })
    if (timeParts[1]) {
      page.drawText(timeParts[1], { x: col.time, y: y - 11, size: 8, font, color: rgb(0.1, 0.12, 0.16) })
    }

    page.drawText(line.licensePlate, { x: col.plate, y, size: sizeBody, font, color: rgb(0.1, 0.12, 0.16) })
    page.drawText(`${line.fee.toLocaleString('vi-VN')}đ`, { x: col.fee, y, size: sizeBody, font, color: rgb(0.1, 0.12, 0.16) })

    y -= timeParts.length > 1 ? 48 : 36
  }

  y -= 8
  page.drawText(`Tổng cộng: ${receipt.totalAmount.toLocaleString('vi-VN')}đ`, {
    x: col.fee - 24,
    y,
    size: 11,
    font,
    color: rgb(0.02, 0.35, 0.22),
  })

  const pdfBytes = await pdfDoc.save()
  return Buffer.from(pdfBytes)
}

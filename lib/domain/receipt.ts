import type { ParkingSession } from './parking-session'

/** Một dòng trên biên lai (đúng các cột yêu cầu). */
export type ReceiptLineDetail = {
  sessionId: string
  sessionNumber: number
  licensePlate: string
  /** Hai dòng: vào / ra — giống cột Thời gian trên history. */
  timeText: string
  fee: number
}

export function formatDateTimeVi(d: Date): string {
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} - ${hour}:${minute}`
}

export function formatSessionTimeRange(timeIn: Date, timeOut: Date): string {
  return `${formatDateTimeVi(timeIn)}\n${formatDateTimeVi(timeOut)}`
}

/**
 * <<Entity>> Receipt — CD History: generateReceipt, PDF tối đa 10 phiên.
 */
export class Receipt {
  private constructor(
    public readonly sessionIds: string[],
    public readonly totalAmount: number,
    public readonly lines: ReceiptLineDetail[],
  ) {}

  static generateReceipt(
    sessionIds: string[],
    allSessions: ParkingSession[],
    maxSessions = 10,
  ): Receipt | null {
    const paid = allSessions.filter((s) => sessionIds.includes(s.sessionId) && s.domainStatus === 'Paid')
    if (paid.length === 0) return null
    const take = paid.slice(0, maxSessions)
    const total = take.reduce((sum, s) => sum + s.finalFee, 0)
    const lines: ReceiptLineDetail[] = take.map((s) => ({
      sessionId: s.sessionId,
      sessionNumber: s.sessionNumber,
      licensePlate: s.plateOut || s.plateIn,
      timeText: formatSessionTimeRange(s.timeIn, s.timeOut),
      fee: s.finalFee,
    }))
    return new Receipt(
      take.map((s) => s.sessionId),
      total,
      lines,
    )
  }
}

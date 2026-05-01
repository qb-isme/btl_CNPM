/** Trạng thái phiên theo đặc tả CD (Pending_Payment / Paid). */
export type DomainSessionStatus = 'Pending_Payment' | 'Paid'

export interface ParkingSessionDto {
  id: string
  sessionNumber: number
  licensePlate: string
  checkInTime: Date
  checkOutTime: Date
  originalFee: number
  discount: number
  finalFee: number
  status: 'paid' | 'unpaid'
  paymentTime?: Date
  transactionCode?: string
  hasPromotion?: boolean
  promotionLabel?: string
}

/** <<Entity>> ParkingSession — theo Class Diagram. */
export class ParkingSession {
  constructor(
    public sessionId: string,
    public sessionNumber: number,
    public timeIn: Date,
    public timeOut: Date,
    public plateIn: string,
    public plateOut: string,
    public originalFee: number,
    public discount: number,
    public finalFee: number,
    public domainStatus: DomainSessionStatus,
    public hasPromotion = false,
    public promotionLabel?: string,
    public paymentTime?: Date,
    public parentTransactionCode?: string,
  ) {}

  /** calculateFeeWithDiscount(role): áp dụng ưu đãi với Cán bộ / Giảng viên (CD). */
  calculateFeeWithDiscount(role: string): number {
    const staffRoles = ['Cán bộ', 'Giảng viên']
    if (staffRoles.includes(role)) {
      const withStaffDiscount = Math.max(0, Math.round(this.originalFee * 0.6))
      return Math.min(this.finalFee, withStaffDiscount)
    }
    return this.finalFee
  }

  /** Cập nhật trạng thái phiên (CD: Pending_Payment → Paid). */
  updateStatus(newStatus: DomainSessionStatus): boolean {
    if (newStatus === 'Pending_Payment' && this.domainStatus === 'Paid') return false
    this.domainStatus = newStatus
    return true
  }

  toDto(): ParkingSessionDto {
    return {
      id: this.sessionId,
      sessionNumber: this.sessionNumber,
      licensePlate: this.plateOut || this.plateIn,
      checkInTime: this.timeIn,
      checkOutTime: this.timeOut,
      originalFee: this.originalFee,
      discount: this.discount,
      finalFee: this.finalFee,
      status: this.domainStatus === 'Paid' ? 'paid' : 'unpaid',
      paymentTime: this.paymentTime,
      transactionCode: this.parentTransactionCode,
      hasPromotion: this.hasPromotion,
      promotionLabel: this.promotionLabel,
    }
  }

  /**
   * getHistory: toàn bộ phiên đã thanh toán của user (mock 1 user — userId bỏ qua).
   * CD History: ParkingSession.getHistory
   */
  static getHistory(allSessions: ParkingSession[], _userId: string): ParkingSession[] {
    return allSessions.filter((s) => s.domainStatus === 'Paid')
  }

  /**
   * filterSessions — CD History: lọc theo khoảng thời gian và biển số.
   */
  static filterSessions(
    allSessions: ParkingSession[],
    _userId: string,
    startTime?: Date | null,
    endTime?: Date | null,
    plate?: string | null,
  ): ParkingSession[] {
    let list = allSessions.filter((s) => s.domainStatus === 'Paid')
    if (startTime) {
      const t0 = startOfDay(startTime)
      list = list.filter((s) => s.timeIn >= t0)
    }
    if (endTime) {
      const t1 = endOfDay(endTime)
      list = list.filter((s) => s.timeIn <= t1)
    }
    if (plate && plate.trim()) {
      const p = plate.trim().toLowerCase()
      list = list.filter((s) => (s.plateOut || s.plateIn).toLowerCase().includes(p))
    }
    return list
  }
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

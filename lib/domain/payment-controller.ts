import type { ParkingSession } from './parking-session'
import { PaymentTransactionEntity } from './payment-transaction'
import type { UserAccountEntity } from './user-account'

export type DebtInfoResponse = {
  userId: string
  fullName: string
  role: string
  email: string
  balance: number
  totalDebt: number
  pendingSessions: ReturnType<ParkingSession['toDto']>[]
}

/**
 * <<Controller>> PaymentController — điều phối UserAccount, ParkingSession, Transaction (CD).
 */
export class PaymentController {
  constructor(
    private readonly sessions: ParkingSession[],
    private readonly user: UserAccountEntity,
  ) {}

  /** CD: tổng hợp nợ + phiên cho giao diện. */
  getDebtInfo(userId: string): DebtInfoResponse {
    void userId
    const pending = this.user.getPendingSessions(this.sessions)
    return {
      userId: this.user.userId,
      fullName: this.user.fullName,
      role: this.user.role,
      email: this.user.email,
      balance: this.user.getCurrentBalance(),
      totalDebt: this.user.calculateTotalDebt(this.sessions),
      pendingSessions: pending.map((s) => s.toDto()),
    }
  }

  /**
   * CD: khởi tạo thanh toán BKPay — URL chuyển hướng (mock: URL nội bộ + token).
   */
  initiatePayment(transactionId: string): string {
    const base =
      typeof process !== 'undefined' && process.env.NEXT_PUBLIC_APP_URL
        ? process.env.NEXT_PUBLIC_APP_URL
        : ''
    return `${base}/payment?bkpayTxn=${encodeURIComponent(transactionId)}`
  }

  /**
   * CD: callback BKPay — cập nhật trạng thái khi gateway báo Success.
   */
  handleBKPayCallback(transactionId: string, status: string): boolean {
    if (status !== 'Success' && status !== 'success') return false
    return transactionId.trim().length > 0
  }

  /**
   * Quyết toán: tạo Transaction, trừ balance, phiên → Paid, log (OTP đã xác thực ở route).
   */
  settleSessions(sessionIds: string[]): { success: boolean; transactionCode?: string; message?: string } {
    const pending = this.user.getPendingSessions(this.sessions)
    const toSettle = pending.filter((s) => sessionIds.includes(s.sessionId))
    if (toSettle.length === 0) {
      return { success: false, message: 'Không có phiên chờ thanh toán khớp.' }
    }

    const totalAmount = toSettle.reduce((sum, s) => sum + s.finalFee, 0)
    if (this.user.getCurrentBalance() < totalAmount) {
      return { success: false, message: 'Số dư hiện tại không đủ để thanh toán.' }
    }

    const paymentTx = PaymentTransactionEntity.createTransaction(this.user.userId, totalAmount, sessionIds)
    paymentTx.logTransaction()

    const bankCode = `#BK${String(Math.floor(Math.random() * 90000) + 10000).padStart(5, '0')}`
    const paymentTime = new Date()

    this.user.deductDebt(totalAmount)

    for (const s of toSettle) {
      s.updateStatus('Paid')
      s.paymentTime = paymentTime
      s.parentTransactionCode = bankCode
    }

    paymentTx.status = 'Success'
    paymentTx.logTransaction()

    return { success: true, transactionCode: bankCode }
  }
}

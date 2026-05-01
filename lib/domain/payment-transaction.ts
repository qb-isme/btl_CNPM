/** Giao dịch thanh toán BKPay — <<Entity>> Transaction trong CD Payment/History. */
export type PaymentWorkflowStatus = 'Processing' | 'Success' | 'Failed'

export interface TransactionLogRow {
  transactionId: string
  amount: number
  status: PaymentWorkflowStatus
  timestamp: Date
  paymentMethod: string
  includedSessionIds: string[]
}

export const transactionPersistenceLog: TransactionLogRow[] = []

export class PaymentTransactionEntity {
  transactionId: string
  amount: number
  status: PaymentWorkflowStatus
  timestamp: Date
  paymentMethod: string
  includedSessionIds: string[]

  private constructor() {
    this.transactionId = ''
    this.amount = 0
    this.status = 'Processing'
    this.timestamp = new Date()
    this.paymentMethod = 'BKPay'
    this.includedSessionIds = []
  }

  /** createTransaction(userId, amount) — CD: tạo giao dịch, trạng thái Processing. */
  static createTransaction(userId: string, amount: number, sessionIds: string[]): PaymentTransactionEntity {
    const t = new PaymentTransactionEntity()
    t.transactionId = `TXN-${userId}-${Date.now()}`
    t.amount = amount
    t.status = 'Processing'
    t.timestamp = new Date()
    t.paymentMethod = 'BKPay'
    t.includedSessionIds = [...sessionIds]
    return t
  }

  /** logTransaction — CD: ghi nhận để đối soát (mock: mảng trong bộ nhớ). */
  logTransaction(): boolean {
    transactionPersistenceLog.push({
      transactionId: this.transactionId,
      amount: this.amount,
      status: this.status,
      timestamp: this.timestamp,
      paymentMethod: this.paymentMethod,
      includedSessionIds: [...this.includedSessionIds],
    })
    return true
  }
}

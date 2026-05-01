import type { ParkingSession } from './parking-session'

/** <<Entity>> UserAccount — theo CD (userId, fullName, role, currentDebt + email History). */
export class UserAccountEntity {
  constructor(
    public userId: string,
    public fullName: string,
    public role: string,
    public email: string,
    public balance: number,
  ) {}

  /** CD Payment: danh sách phiên Chờ thanh toán. */
  getPendingSessions(allSessions: ParkingSession[]): ParkingSession[] {
    return allSessions.filter((s) => s.domainStatus === 'Pending_Payment')
  }

  /**
   * CD Payment: currentDebt = currentDebt - amount (ở đây amount là tổng thanh toán;
   * đồng bộ nợ qua lại từ phiên — trừ balance ví). */
  deductDebt(amount: number): void {
    this.balance -= amount
  }

  /** CD History: tổng dư nợ từ phiên chưa thanh toán. */
  calculateTotalDebt(allSessions: ParkingSession[]): number {
    return allSessions
      .filter((s) => s.domainStatus === 'Pending_Payment')
      .reduce((sum, s) => sum + s.finalFee, 0)
  }

  /** CD History: số dư hiện tại. */
  getCurrentBalance(): number {
    return this.balance
  }
}

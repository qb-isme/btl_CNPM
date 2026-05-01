// Mock Data Store for Parking System
import { ParkingSession, UserAccountEntity, PaymentController, Receipt } from '@/lib/domain';

export interface Zone {
  id: string;
  name: string;
  totalSlots: number;
  status: 'active' | 'maintenance' | 'inactive';
}

export interface ParkingSlot {
  id: string;
  zoneId: string;
  slotNumber: number;
  row: number;
  col: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  vehicle?: {
    licensePlate: string;
    vehicleType: string;
    checkInTime: Date;
  };
}

export interface Transaction {
  id: string;
  sessionNumber: number;
  licensePlate: string;
  checkInTime: Date;
  checkOutTime: Date;
  originalFee: number;
  discount: number;
  finalFee: number;
  status: 'paid' | 'unpaid';
  paymentTime?: Date;
  transactionCode?: string;
  hasPromotion?: boolean;
  promotionLabel?: string;
}

/** Snapshot giao diện / API — ánh xạ từ UserAccountEntity (CD). */
export interface UserAccount {
  id: string;
  name: string;
  role: string;
  email: string;
  balance: number;
  totalDebt: number;
}

// Zones data
export const zones: Zone[] = [
  { id: 'zone-a', name: 'Khu A', totalSlots: 100, status: 'active' },
  { id: 'zone-b', name: 'Khu B', totalSlots: 100, status: 'active' },
  { id: 'zone-c', name: 'Khu C', totalSlots: 100, status: 'active' },
  { id: 'zone-d', name: 'Khu D', totalSlots: 100, status: 'maintenance' },
  { id: 'zone-e', name: 'Khu E', totalSlots: 100, status: 'active' },
  { id: 'zone-f', name: 'Khu F', totalSlots: 100, status: 'active' },
];

// Generate parking slots
const generateSlots = (zoneId: string, rows: number, cols: number, occupiedCount: number): ParkingSlot[] => {
  const slots: ParkingSlot[] = [];
  let slotNumber = 1;
  const occupiedSlots = new Set<number>();

  while (occupiedSlots.size < occupiedCount) {
    occupiedSlots.add(Math.floor(Math.random() * (rows * cols)) + 1);
  }

  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      const isOccupied = occupiedSlots.has(slotNumber);
      slots.push({
        id: `${zoneId}-slot-${slotNumber}`,
        zoneId,
        slotNumber,
        row,
        col,
        status: isOccupied ? 'occupied' : 'available',
        vehicle: isOccupied ? {
          licensePlate: `30A-${String(Math.floor(Math.random() * 90000) + 10000)}`,
          vehicleType: 'car',
          checkInTime: new Date(Date.now() - Math.random() * 3600000 * 5),
        } : undefined,
      });
      slotNumber++;
    }
  }
  return slots;
};

// Initialize parking slots with different occupancy rates
export const parkingSlots: Record<string, ParkingSlot[]> = {
  'zone-a': generateSlots('zone-a', 10, 10, 55),
  'zone-b': generateSlots('zone-b', 10, 10, 10),
  'zone-c': generateSlots('zone-c', 10, 10, 100),
  'zone-d': generateSlots('zone-d', 10, 10, 0),
  'zone-e': generateSlots('zone-e', 10, 10, 0),
  'zone-f': generateSlots('zone-f', 10, 10, 70),
};

// Helper functions
export function getZoneWithOccupancy(zone: Zone) {
  const slots = parkingSlots[zone.id] || [];
  const availableSlots = slots.filter(s => s.status === 'available').length;
  const occupiedSlots = slots.filter(s => s.status === 'occupied').length;

  return {
    ...zone,
    availableSlots,
    occupiedSlots,
    occupancyRate: zone.status === 'maintenance' ? null : Math.round((occupiedSlots / zone.totalSlots) * 100),
  };
}

export function getAllZonesWithOccupancy() {
  return zones.map(getZoneWithOccupancy);
}

export function getSlotById(slotId: string): ParkingSlot | undefined {
  for (const zoneId in parkingSlots) {
    const slot = parkingSlots[zoneId].find(s => s.id === slotId);
    if (slot) return slot;
  }
  return undefined;
}

export function updateSlotStatus(slotId: string, status: ParkingSlot['status'], vehicle?: ParkingSlot['vehicle']) {
  for (const zoneId in parkingSlots) {
    const slot = parkingSlots[zoneId].find(s => s.id === slotId);
    if (slot) {
      slot.status = status;
      if (vehicle) {
        slot.vehicle = vehicle;
      } else {
        delete slot.vehicle;
      }
      return slot;
    }
  }
  return null;
}

/** <<Entity>> UserAccount — thực thể domain (CD). */
export const userAccountEntity = new UserAccountEntity(
  'user-001',
  'Nguyễn Văn Sang',
  'Sinh viên',
  'sang.uni@example.edu.vn',
  20000,
);

/** Danh sách phiên gửi xe + cước (<<Entity>> ParkingSession). */
export const billingSessions: ParkingSession[] = [
  new ParkingSession(
    'txn-001',
    1,
    new Date('2026-04-15T08:30:00'),
    new Date('2026-04-15T10:30:00'),
    '51AK-173.15',
    '51AK-173.15',
    5000,
    0,
    5000,
    'Pending_Payment',
  ),
  new ParkingSession(
    'txn-002',
    2,
    new Date('2026-04-15T14:30:00'),
    new Date('2026-04-15T15:30:00'),
    '59AE-132.98',
    '59AE-132.98',
    5000,
    2000,
    3000,
    'Pending_Payment',
    true,
    'Ưu đãi',
  ),
  new ParkingSession(
    'txn-003',
    3,
    new Date('2026-04-15T16:45:00'),
    new Date('2026-04-15T17:15:00'),
    '50B1-315.05',
    '50B1-315.05',
    5000,
    0,
    5000,
    'Pending_Payment',
  ),
  new ParkingSession(
    'txn-004',
    4,
    new Date('2026-04-16T09:15:00'),
    new Date('2026-04-16T11:45:00'),
    '30A-789456',
    '30A-789456',
    8000,
    0,
    8000,
    'Pending_Payment',
  ),
  new ParkingSession(
    'txn-005',
    5,
    new Date('2026-04-16T13:20:00'),
    new Date('2026-04-16T14:50:00'),
    '29W-654321',
    '29W-654321',
    6000,
    2000,
    4000,
    'Pending_Payment',
    true,
    'Ưu đãi',
  ),
  new ParkingSession(
    'txn-006',
    6,
    new Date('2026-04-16T15:30:00'),
    new Date('2026-04-16T18:00:00'),
    '38K-147258',
    '38K-147258',
    10000,
    0,
    10000,
    'Pending_Payment',
  ),
];

/** <<Controller>> PaymentController (CD). */
export const paymentController = new PaymentController(billingSessions, userAccountEntity);

/** Snapshot cho API legacy — đồng bộ qua syncUserAccountFromEntity(). */
export const userAccount: UserAccount = {
  id: userAccountEntity.userId,
  name: userAccountEntity.fullName,
  role: userAccountEntity.role,
  email: userAccountEntity.email,
  balance: userAccountEntity.getCurrentBalance(),
  totalDebt: userAccountEntity.calculateTotalDebt(billingSessions),
};

export function syncUserAccountFromEntity() {
  userAccount.id = userAccountEntity.userId;
  userAccount.name = userAccountEntity.fullName;
  userAccount.role = userAccountEntity.role;
  userAccount.email = userAccountEntity.email;
  userAccount.balance = userAccountEntity.getCurrentBalance();
  userAccount.totalDebt = userAccountEntity.calculateTotalDebt(billingSessions);
}

/**
 * Phần trăm giảm trên giá gốc cho phiên có ưu đãi (chưa thanh toán), dùng khi chạy thử dự án.
 * Mặc định 40% như nhãn Ưu đãi (-40%).
 */
export let demoPromotionPercent = 40

export function setDemoPromotionPercent(percent: number): void {
  const p = Math.min(100, Math.max(0, Math.round(percent)))
  demoPromotionPercent = p
  for (const s of billingSessions) {
    if (s.hasPromotion && s.domainStatus === 'Pending_Payment') {
      s.discount = Math.round((s.originalFee * p) / 100)
      s.finalFee = Math.max(0, s.originalFee - s.discount)
    }
  }
  syncUserAccountFromEntity()
}

export function getAllTransactionDtos(): Transaction[] {
  return billingSessions.map((s) => s.toDto());
}

export function getUnpaidTransactions(): Transaction[] {
  return userAccountEntity.getPendingSessions(billingSessions).map((s) => s.toDto());
}

export function getPaidTransactions(): Transaction[] {
  return billingSessions
    .filter(
      (s) =>
        s.domainStatus === 'Paid' &&
        s.paymentTime != null &&
        s.parentTransactionCode != null &&
        s.parentTransactionCode.trim().length > 0,
    )
    .map((s) => s.toDto());
}

export function getHistoryForUser(userId: string): Transaction[] {
  return ParkingSession.getHistory(billingSessions, userId).map((s) => s.toDto());
}

export function filterHistorySessions(
  userId: string,
  startTime?: Date | null,
  endTime?: Date | null,
  plate?: string | null,
): Transaction[] {
  return ParkingSession.filterSessions(billingSessions, userId, startTime, endTime, plate).map((s) => s.toDto());
}

export function calculateTotalDebt(): number {
  return userAccountEntity.calculateTotalDebt(billingSessions);
}

export function processPayment(transactionIds: string[]): { success: boolean; transactionCode?: string; message?: string } {
  const result = paymentController.settleSessions(transactionIds);
  if (result.success) syncUserAccountFromEntity();
  return result;
}

export function generateReceiptForSessions(sessionIds: string[]): Receipt | null {
  return Receipt.generateReceipt(sessionIds, billingSessions, 10);
}

export {
  ParkingSession,
  UserAccountEntity,
  PaymentController,
  Receipt,
  PaymentTransactionEntity,
  transactionPersistenceLog,
} from '@/lib/domain';

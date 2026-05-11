

export type ZoneId = 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
export type SlotStatus = 'empty' | 'available' | 'occupied' | 'reserved' | 'maintenance';
export type ZoneMode = 'active' | 'offline' | 'maintenance';

export type ParkingSlot = {
  id: string;
  status: SlotStatus;
  vehicle?: {
    licensePlate: string;
    vehicleType: string;
    checkInTime: Date | string;
  };
};

export type ParkingZone = {
  id: ZoneId;
  name: string;
  type: 'Sinh viên' | 'Cán bộ';
  mode: ZoneMode;
  slots: ParkingSlot[];
};

export const PARKING_ZONES_STORAGE_KEY = 'bk_parking_zones_v1';

export const createSlots = (zoneId: ZoneId, occupiedIndexes: number[] = []): ParkingSlot[] => {
  return Array.from({ length: 12 }, (_, index) => {
    const number = index + 1;
    return {
      id: `${zoneId}${number}`,
      status: occupiedIndexes.includes(number) ? 'occupied' : 'empty',
    };
  });
};

export const INITIAL_PARKING_ZONES: ParkingZone[] = [
  { id: 'A', name: 'Khu A (Gần cổng)', type: 'Sinh viên', mode: 'active', slots: createSlots('A', [1, 4, 7, 10]) },
  { id: 'B', name: 'Khu B (Trung tâm)', type: 'Sinh viên', mode: 'active', slots: createSlots('B', [1, 2, 4, 5, 6, 7, 9, 10, 11, 12]) },
  { id: 'C', name: 'Khu C (Căn tin)', type: 'Sinh viên', mode: 'active', slots: createSlots('C', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) },
  { id: 'D', name: 'Khu D (Khuất)', type: 'Sinh viên', mode: 'offline', slots: createSlots('D') },
  { id: 'E', name: 'Khu Cán bộ GV', type: 'Cán bộ', mode: 'maintenance', slots: createSlots('E') },
  { id: 'F', name: 'Khu F (Mở rộng)', type: 'Sinh viên', mode: 'active', slots: createSlots('F', [2, 6]) },
];

export const zones = INITIAL_PARKING_ZONES;
export const parkingSlots: Record<ZoneId, ParkingSlot[]> = INITIAL_PARKING_ZONES.reduce((acc, zone) => {
  acc[zone.id] = zone.slots;
  return acc;
}, {} as Record<ZoneId, ParkingSlot[]>);

const isAvailableSlot = (slot: ParkingSlot) => slot.status === 'empty' || slot.status === 'available';

export function getOccupiedCount(zone: ParkingZone) {
  return zone.slots.filter((slot) => slot.status === 'occupied').length;
}

export function getReservedCount(zone: ParkingZone) {
  return zone.slots.filter((slot) => slot.status === 'reserved').length;
}

export function getUnavailableCount(zone: ParkingZone) {
  return getOccupiedCount(zone) + getReservedCount(zone);
}

export function getAvailableCount(zone: ParkingZone) {
  if (zone.mode !== 'active') return 0;
  return zone.slots.filter(isAvailableSlot).length;
}

export function getZoneStatusLabel(zone: ParkingZone) {
  if (zone.mode === 'offline') return 'Mất tín hiệu';
  if (zone.mode === 'maintenance') return 'Bảo trì';

  const unavailableCount = getUnavailableCount(zone);
  if (unavailableCount >= zone.slots.length) return 'Hết chỗ';
  if (unavailableCount >= 9) return 'Gần đầy';
  return 'Còn chỗ';
}

export function getMapStatus(zone: ParkingZone) {
  if (zone.mode === 'offline') return 'gray';
  if (zone.mode === 'maintenance') return 'maintenance';

  const unavailableCount = getUnavailableCount(zone);
  if (unavailableCount >= zone.slots.length) return 'red';
  if (unavailableCount >= 9) return 'yellow';
  return 'green';
}

export function getZoneUsageText(zone: ParkingZone) {
  if (zone.mode === 'offline') return `--/${zone.slots.length}`;
  return `${getUnavailableCount(zone)}/${zone.slots.length}`;
}

export function getZoneWithOccupancy(zone: ParkingZone) {
  const availableSlots = getAvailableCount(zone);
  const occupiedSlots = getOccupiedCount(zone);
  return {
    ...zone,
    totalSlots: zone.slots.length,
    availableSlots,
    occupiedSlots,
    occupancyRate: zone.mode !== 'active' ? null : Math.round((occupiedSlots / zone.slots.length) * 100),
  };
}

export function getAllZonesWithOccupancy() {
  return INITIAL_PARKING_ZONES.map(getZoneWithOccupancy);
}

export function getSlotById(slotId: string): ParkingSlot | undefined {
  for (const zone of INITIAL_PARKING_ZONES) {
    const slot = zone.slots.find((item) => item.id === slotId);
    if (slot) return slot;
  }
  return undefined;
}

export function updateSlotStatus(slotId: string, status: SlotStatus, vehicle?: ParkingSlot['vehicle']) {
  const slot = getSlotById(slotId);
  if (!slot) return null;
  slot.status = status;
  if (vehicle) slot.vehicle = vehicle;
  else delete slot.vehicle;
  return slot;
}

function isValidParkingZones(value: unknown): value is ParkingZone[] {
  if (!Array.isArray(value)) return false;
  return value.every((zone) => {
    if (!zone || typeof zone !== 'object') return false;
    const record = zone as Partial<ParkingZone>;
    return (
      typeof record.id === 'string' &&
      typeof record.name === 'string' &&
      typeof record.type === 'string' &&
      typeof record.mode === 'string' &&
      Array.isArray(record.slots)
    );
  });
}


function reopenZoneB(zones: ParkingZone[]): ParkingZone[] {
  return zones.map((zone) => {
    if (zone.id !== 'B') return zone;

    return {
      ...zone,
      name: 'Khu B (Trung tâm)',
      mode: 'active',
    };
  });
}

export function readParkingZonesFromStorage() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(PARKING_ZONES_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!isValidParkingZones(parsed)) return null;
    const normalizedZones = reopenZoneB(parsed);
    window.localStorage.setItem(PARKING_ZONES_STORAGE_KEY, JSON.stringify(normalizedZones));
    return normalizedZones;
  } catch {
    return null;
  }
}

export function writeParkingZonesToStorage(nextZones: ParkingZone[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(PARKING_ZONES_STORAGE_KEY, JSON.stringify(reopenZoneB(nextZones)));
}

// ===============================
// UC2 - Thanh toán và lịch sử phí
// ===============================

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

export interface UserAccount {
  id: string;
  name: string;
  role: string;
  email: string;
  balance: number;
  totalDebt: number;
}

export const billingSessions: Transaction[] = [
  {
    id: 'txn-001',
    sessionNumber: 1,
    checkInTime: new Date('2026-04-15T08:30:00'),
    checkOutTime: new Date('2026-04-15T10:30:00'),
    licensePlate: '51AK-173.15',
    originalFee: 5000,
    discount: 0,
    finalFee: 5000,
    status: 'unpaid',
  },
  {
    id: 'txn-002',
    sessionNumber: 2,
    checkInTime: new Date('2026-04-15T14:30:00'),
    checkOutTime: new Date('2026-04-15T15:30:00'),
    licensePlate: '59AE-132.98',
    originalFee: 5000,
    discount: 2000,
    finalFee: 3000,
    status: 'unpaid',
    hasPromotion: true,
    promotionLabel: 'Ưu đãi',
  },
  {
    id: 'txn-003',
    sessionNumber: 3,
    checkInTime: new Date('2026-04-15T16:45:00'),
    checkOutTime: new Date('2026-04-15T17:15:00'),
    licensePlate: '50B1-315.05',
    originalFee: 5000,
    discount: 0,
    finalFee: 5000,
    status: 'unpaid',
  },
  {
    id: 'txn-004',
    sessionNumber: 4,
    checkInTime: new Date('2026-04-16T09:15:00'),
    checkOutTime: new Date('2026-04-16T11:45:00'),
    licensePlate: '30A-789.45',
    originalFee: 8000,
    discount: 0,
    finalFee: 8000,
    status: 'unpaid',
  },
  {
    id: 'txn-005',
    sessionNumber: 5,
    checkInTime: new Date('2026-04-16T13:20:00'),
    checkOutTime: new Date('2026-04-16T14:50:00'),
    licensePlate: '29W-654.32',
    originalFee: 6000,
    discount: 2000,
    finalFee: 4000,
    status: 'unpaid',
    hasPromotion: true,
    promotionLabel: 'Ưu đãi',
  },
  {
    id: 'txn-006',
    sessionNumber: 6,
    checkInTime: new Date('2026-04-16T15:30:00'),
    checkOutTime: new Date('2026-04-16T18:00:00'),
    licensePlate: '38K-147.25',
    originalFee: 10000,
    discount: 0,
    finalFee: 10000,
    status: 'unpaid',
  },
];

export let demoPromotionPercent = 40;

export const userAccount: UserAccount = {
  id: 'user-001',
  name: 'Nguyễn Văn Sang',
  role: 'Sinh viên',
  email: 'sang.uni@example.edu.vn',
  balance: 20000,
  totalDebt: 0,
};

export const transactionPersistenceLog: Array<{ action: string; transactionIds: string[]; createdAt: Date; transactionCode?: string }> = [];

export function calculateTotalDebt(): number {
  return billingSessions.filter((session) => session.status === 'unpaid').reduce((sum, session) => sum + session.finalFee, 0);
}

export function syncUserAccountFromEntity() {
  userAccount.totalDebt = calculateTotalDebt();
  return userAccount;
}

syncUserAccountFromEntity();

export function setDemoPromotionPercent(percent: number): void {
  const p = Math.min(100, Math.max(0, Math.round(percent)));
  demoPromotionPercent = p;
  for (const session of billingSessions) {
    if (session.hasPromotion && session.status === 'unpaid') {
      session.discount = Math.round((session.originalFee * p) / 100);
      session.finalFee = Math.max(0, session.originalFee - session.discount);
    }
  }
  syncUserAccountFromEntity();
}

export function getAllTransactionDtos(): Transaction[] {
  return billingSessions;
}

export function getUnpaidTransactions(): Transaction[] {
  return billingSessions.filter((session) => session.status === 'unpaid');
}

export function getPaidTransactions(): Transaction[] {
  return billingSessions.filter((session) => session.status === 'paid');
}

export function getHistoryForUser(_userId: string): Transaction[] {
  return billingSessions;
}

export function filterHistorySessions(
  userId: string,
  startTime?: Date | null,
  endTime?: Date | null,
  plate?: string | null,
): Transaction[] {
  return getHistoryForUser(userId).filter((session) => {
    if (startTime && session.checkInTime < startTime) return false;
    if (endTime && session.checkInTime > endTime) return false;
    if (plate && !session.licensePlate.toLowerCase().includes(plate.toLowerCase())) return false;
    return true;
  });
}

export function processPayment(transactionIds: string[]): { success: boolean; transactionCode?: string; message?: string; newBalance?: number; newDebt?: number } {
  const selected = billingSessions.filter((session) => transactionIds.includes(session.id) && session.status === 'unpaid');
  if (selected.length === 0) {
    return { success: false, message: 'Không có phiên gửi xe nào cần thanh toán.' };
  }

  const amount = selected.reduce((sum, session) => sum + session.finalFee, 0);
  if (userAccount.balance < amount) {
    return { success: false, message: 'Số dư BKPay không đủ để thực hiện giao dịch.' };
  }

  const transactionCode = `BK${Date.now().toString().slice(-8)}`;
  const paymentTime = new Date();

  for (const session of selected) {
    session.status = 'paid';
    session.paymentTime = paymentTime;
    session.transactionCode = transactionCode;
  }

  userAccount.balance -= amount;
  syncUserAccountFromEntity();
  transactionPersistenceLog.push({ action: 'PAYMENT_SETTLED', transactionIds, createdAt: paymentTime, transactionCode });

  return { success: true, transactionCode, newBalance: userAccount.balance, newDebt: userAccount.totalDebt };
}

export type Receipt = {
  receiptCode: string;
  sessionIds: string[];
  sessions: Transaction[];
  totalAmount: number;
  generatedAt: Date;
};

export function generateReceiptForSessions(sessionIds: string[]): Receipt | null {
  const sessions = billingSessions.filter((session) => sessionIds.includes(session.id) && session.status === 'paid');
  if (sessions.length === 0) return null;

  return {
    receiptCode: `RC${Date.now().toString().slice(-8)}`,
    sessionIds,
    sessions,
    totalAmount: sessions.reduce((sum, session) => sum + session.finalFee, 0),
    generatedAt: new Date(),
  };
}

export const userAccountEntity = {
  userId: userAccount.id,
  fullName: userAccount.name,
  role: userAccount.role,
  email: userAccount.email,
  getCurrentBalance: () => userAccount.balance,
  calculateTotalDebt: () => calculateTotalDebt(),
  getPendingSessions: () => getUnpaidTransactions(),
};

export const paymentController = {
  settleSessions: processPayment,
};

export class ParkingSession {}
export class UserAccountEntity {}
export class PaymentController {}
export class PaymentTransactionEntity {}


// ===============================
// UC5 - Vận hành cổng / xử lý ngoại lệ xe ra
// ===============================

export type UserType = 'guest' | 'student' | 'staff';
export type CardStatus = 'ok' | 'damaged' | 'lost' | 'none';
export type SessionStatus = 'active' | 'exited' | 'flagged';
export type AlertType = 'plate_mismatch' | 'blacklist';
export type EmergencyType = 'ambulance' | 'fire' | 'vip' | 'hardware';
export type TicketStatus = 'pending' | 'resolved';

export interface ActiveSession {
  id: string;
  licensePlate: string;
  cardId: string | null;
  userType: UserType;
  ownerName: string;
  studentId?: string;
  checkInTime: Date;
  checkInPhoto: string;
  zone: string;
  slotId: string;
  status: SessionStatus;
  cardStatus: CardStatus;
}

export interface SecurityAlert {
  id: string;
  sessionId: string;
  licensePlate: string;
  alertType: AlertType;
  detectedAt: Date;
  notes: string;
  resolved: boolean;
}

export interface IncidentTicket {
  id: string;
  emergencyType: EmergencyType;
  licensePlate: string | null;
  createdAt: Date;
  status: TicketStatus;
  notes: string;
  operatorNotes?: string;
}

export const activeSessions: ActiveSession[] = [
  {
    id: 'sess-001',
    licensePlate: '51A-12345',
    cardId: 'CARD-0012',
    userType: 'student',
    ownerName: 'Trần Văn Bình',
    studentId: 'B20DCCN001',
    checkInTime: new Date(Date.now() - 1000 * 60 * 90),
    checkInPhoto: 'https://placehold.co/200x140/1E293B/94A3B8?text=Check-in+Photo',
    zone: 'Khu A',
    slotId: 'zone-a-slot-3',
    status: 'active',
    cardStatus: 'ok',
  },
  {
    id: 'sess-002',
    licensePlate: '29B-54321',
    cardId: 'CARD-0034',
    userType: 'staff',
    ownerName: 'Lê Thị Hương',
    studentId: 'CB00042',
    checkInTime: new Date(Date.now() - 1000 * 60 * 200),
    checkInPhoto: 'https://placehold.co/200x140/1E293B/94A3B8?text=Check-in+Photo',
    zone: 'Khu Cán bộ',
    slotId: 'zone-e-slot-7',
    status: 'active',
    cardStatus: 'ok',
  },
  {
    id: 'sess-003',
    licensePlate: '30F-99887',
    cardId: null,
    userType: 'guest',
    ownerName: '',
    checkInTime: new Date(Date.now() - 1000 * 60 * 45),
    checkInPhoto: 'https://placehold.co/200x140/1E293B/94A3B8?text=Check-in+Photo',
    zone: 'Khu F',
    slotId: 'zone-f-slot-11',
    status: 'active',
    cardStatus: 'lost',
  },
  {
    id: 'sess-004',
    licensePlate: '43C-77001',
    cardId: 'CARD-0099',
    userType: 'student',
    ownerName: 'Nguyễn Minh Đức',
    studentId: 'B21DCCN099',
    checkInTime: new Date(Date.now() - 1000 * 60 * 30),
    checkInPhoto: 'https://placehold.co/200x140/1E293B/94A3B8?text=Check-in+Photo',
    zone: 'Khu B',
    slotId: 'zone-b-slot-5',
    status: 'flagged',
    cardStatus: 'ok',
  },
];

export const securityAlerts: SecurityAlert[] = [
  {
    id: 'alert-001',
    sessionId: 'sess-004',
    licensePlate: '43C-77001',
    alertType: 'plate_mismatch',
    detectedAt: new Date(Date.now() - 1000 * 60 * 2),
    notes: 'Camera ra phát hiện biển số không khớp: xe vào là 43C-77001, camera đọc 43C-77000.',
    resolved: false,
  },
];

export const incidentTickets: IncidentTicket[] = [
  {
    id: 'ticket-001',
    emergencyType: 'ambulance',
    licensePlate: '43Z-11122',
    createdAt: new Date(Date.now() - 1000 * 60 * 15),
    status: 'pending',
    notes: 'Xe cấp cứu vào khu nội trú – cần giải trình thêm.',
  },
];

export const PARKING_RATE_PER_HOUR = 5000;
export const LOST_CARD_PENALTY = 50000;
export const GUEST_LOST_CARD_PENALTY = 100000;
export const ILLEGAL_EXIT_FINE = 100000;

export function calcParkingFee(checkInTime: Date): number {
  const hours = Math.max(1, Math.ceil((Date.now() - checkInTime.getTime()) / (1000 * 60 * 60)));
  return hours * PARKING_RATE_PER_HOUR;
}

export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

export function formatDuration(checkInTime: Date): string {
  const minutes = Math.floor((Date.now() - checkInTime.getTime()) / 60000);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} phút`;
}

// ===============================
// UC5.4 - Giám sát trạng thái thiết bị IoT
// ===============================

export type IotDeviceType = 'sensor' | 'gateway' | 'led';
export type IotDeviceStatus = 'online' | 'warning' | 'offline' | 'maintenance';
export type IotAlertSeverity = 'medium' | 'high' | 'critical';
export type IotAlertStatus = 'active' | 'investigating' | 'resolved';

export interface IotDevice {
  id: string;
  name: string;
  type: IotDeviceType;
  zone: string;
  status: IotDeviceStatus;
  battery: number | null;
  signal: number;
  latencyMs: number | null;
  uptime: number;
  firmware: string;
  lastSeen: string;
  messagesPerMinute: number;
  healthNote: string;
  history: string[];
}

export interface IotAlert {
  id: string;
  deviceId: string;
  deviceName: string;
  zone: string;
  title: string;
  severity: IotAlertSeverity;
  status: IotAlertStatus;
  createdAt: string;
  recommendation: string;
}

export interface IotDashboard {
  generatedAt: string;
  summary: {
    totalDevices: number;
    online: number;
    warning: number;
    offline: number;
    maintenance: number;
    availabilityRate: number;
    averageBattery: number;
    activeAlerts: number;
    criticalAlerts: number;
  };
  devices: IotDevice[];
  alerts: IotAlert[];
}

interface IotDeviceSeed extends Omit<IotDevice, 'lastSeen'> {
  lastSeenMinutesAgo: number;
}

interface IotAlertSeed extends Omit<IotAlert, 'createdAt'> {
  createdMinutesAgo: number;
}

const toIsoMinutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

const iotDeviceSeeds: IotDeviceSeed[] = [
  {
    id: 'SEN-A1',
    name: 'Sensor A1',
    type: 'sensor',
    zone: 'Khu A',
    status: 'online',
    battery: 82,
    signal: 94,
    latencyMs: 38,
    uptime: 99.8,
    firmware: '1.8.4',
    lastSeenMinutesAgo: 0,
    messagesPerMinute: 58,
    healthNote: 'Hoat dong on dinh',
    history: ['14:18 Online', '14:24 Battery OK', '14:30 Sync OK'],
  },
  {
    id: 'SEN-A2',
    name: 'Sensor A2',
    type: 'sensor',
    zone: 'Khu A',
    status: 'offline',
    battery: 15,
    signal: 8,
    latencyMs: null,
    uptime: 92.1,
    firmware: '1.8.1',
    lastSeenMinutesAgo: 7,
    messagesPerMinute: 0,
    healthNote: 'Pin yeu - Offline',
    history: ['14:20 Online', '14:30 Pin yeu', '14:34 Offline'],
  },
  {
    id: 'SEN-A3',
    name: 'Sensor A3',
    type: 'sensor',
    zone: 'Khu A',
    status: 'warning',
    battery: 31,
    signal: 72,
    latencyMs: 86,
    uptime: 98.6,
    firmware: '1.8.4',
    lastSeenMinutesAgo: 1,
    messagesPerMinute: 44,
    healthNote: 'Can thay pin trong 24h',
    history: ['14:05 Online', '14:21 Pin thap', '14:32 Sync OK'],
  },
  {
    id: 'GTW-A',
    name: 'Gateway A',
    type: 'gateway',
    zone: 'Khu A',
    status: 'offline',
    battery: null,
    signal: 0,
    latencyMs: null,
    uptime: 88.2,
    firmware: '3.2.0',
    lastSeenMinutesAgo: 9,
    messagesPerMinute: 0,
    healthNote: 'Mat ket noi MQTT',
    history: ['14:10 Online', '14:29 Goi tin cham', '14:34 Offline'],
  },
  {
    id: 'LED-A',
    name: 'Bang LED A',
    type: 'led',
    zone: 'Khu A',
    status: 'online',
    battery: null,
    signal: 91,
    latencyMs: 45,
    uptime: 99.4,
    firmware: '2.5.2',
    lastSeenMinutesAgo: 0,
    messagesPerMinute: 18,
    healthNote: 'Hien thi dung suc chua',
    history: ['14:18 Online', '14:25 Cap nhat 45/100', '14:33 Sync OK'],
  },
  {
    id: 'GTW-B',
    name: 'Gateway B',
    type: 'gateway',
    zone: 'Khu B',
    status: 'online',
    battery: null,
    signal: 89,
    latencyMs: 41,
    uptime: 99.9,
    firmware: '3.2.1',
    lastSeenMinutesAgo: 0,
    messagesPerMinute: 126,
    healthNote: 'Hoat dong on dinh',
    history: ['14:12 Online', '14:24 MQTT OK', '14:34 Sync OK'],
  },
  {
    id: 'SEN-B1',
    name: 'Sensor B1',
    type: 'sensor',
    zone: 'Khu B',
    status: 'online',
    battery: 76,
    signal: 87,
    latencyMs: 52,
    uptime: 99.2,
    firmware: '1.8.4',
    lastSeenMinutesAgo: 0,
    messagesPerMinute: 49,
    healthNote: 'Hoat dong on dinh',
    history: ['14:17 Online', '14:27 Battery OK', '14:34 Sync OK'],
  },
  {
    id: 'LED-B',
    name: 'Bang LED B',
    type: 'led',
    zone: 'Khu B',
    status: 'warning',
    battery: null,
    signal: 66,
    latencyMs: 118,
    uptime: 97.4,
    firmware: '2.4.8',
    lastSeenMinutesAgo: 2,
    messagesPerMinute: 9,
    healthNote: 'Cham dong bo du lieu suc chua',
    history: ['14:04 Online', '14:22 Do tre cao', '14:32 Sync cham'],
  },
  {
    id: 'GTW-C',
    name: 'Gateway C',
    type: 'gateway',
    zone: 'Khu C',
    status: 'maintenance',
    battery: null,
    signal: 0,
    latencyMs: null,
    uptime: 0,
    firmware: '3.1.9',
    lastSeenMinutesAgo: 180,
    messagesPerMinute: 0,
    healthNote: 'Dang bao tri dinh ky',
    history: ['11:20 Offline', '11:35 Tao lenh bao tri', '12:00 Bao tri'],
  },
  {
    id: 'SEN-C1',
    name: 'Sensor C1',
    type: 'sensor',
    zone: 'Khu C',
    status: 'online',
    battery: 68,
    signal: 84,
    latencyMs: 49,
    uptime: 98.9,
    firmware: '1.8.4',
    lastSeenMinutesAgo: 0,
    messagesPerMinute: 51,
    healthNote: 'Hoat dong on dinh',
    history: ['14:13 Online', '14:28 Battery OK', '14:34 Sync OK'],
  },
  {
    id: 'SEN-D1',
    name: 'Sensor D1',
    type: 'sensor',
    zone: 'Khu D',
    status: 'warning',
    battery: 43,
    signal: 54,
    latencyMs: 132,
    uptime: 96.1,
    firmware: '1.8.2',
    lastSeenMinutesAgo: 3,
    messagesPerMinute: 22,
    healthNote: 'Tin hieu yeu do khu vuc khuat',
    history: ['14:02 Online', '14:19 RSSI thap', '14:31 Do tre cao'],
  },
  {
    id: 'LED-D',
    name: 'Bang LED D',
    type: 'led',
    zone: 'Khu D',
    status: 'online',
    battery: null,
    signal: 81,
    latencyMs: 61,
    uptime: 99.1,
    firmware: '2.5.2',
    lastSeenMinutesAgo: 0,
    messagesPerMinute: 15,
    healthNote: 'Hien thi dung suc chua',
    history: ['14:16 Online', '14:26 Cap nhat 0/100', '14:34 Sync OK'],
  },
];

const iotAlertSeeds: IotAlertSeed[] = [
  {
    id: 'ALT-001',
    deviceId: 'GTW-A',
    deviceName: 'Gateway A',
    zone: 'Khu A',
    title: 'Gateway khu A Offline',
    severity: 'critical',
    status: 'active',
    createdMinutesAgo: 9,
    recommendation: 'Kiem tra nguon cap va ket noi mang tai tu dieu khien khu A.',
  },
  {
    id: 'ALT-002',
    deviceId: 'SEN-A2',
    deviceName: 'Sensor A2',
    zone: 'Khu A',
    title: 'Sensor A2 pin yeu va mat ket noi',
    severity: 'high',
    status: 'active',
    createdMinutesAgo: 7,
    recommendation: 'Tao yeu cau thay pin, sau do reset sensor va dong bo lai gateway.',
  },
  {
    id: 'ALT-003',
    deviceId: 'SEN-A3',
    deviceName: 'Sensor A3',
    zone: 'Khu A',
    title: 'Pin sensor A3 duoi nguong an toan',
    severity: 'medium',
    status: 'investigating',
    createdMinutesAgo: 14,
    recommendation: 'Lap lich thay pin trong ca truc hien tai.',
  },
  {
    id: 'ALT-004',
    deviceId: 'LED-B',
    deviceName: 'Bang LED B',
    zone: 'Khu B',
    title: 'Bang LED khu B dong bo cham',
    severity: 'medium',
    status: 'investigating',
    createdMinutesAgo: 22,
    recommendation: 'Kiem tra do tre gateway B va cap nhat firmware LED neu can.',
  },
];

export function getIotDevices(): IotDevice[] {
  return iotDeviceSeeds.map(({ lastSeenMinutesAgo, ...device }) => ({
    ...device,
    lastSeen: toIsoMinutesAgo(lastSeenMinutesAgo),
  }));
}

export function getIotAlerts(): IotAlert[] {
  return iotAlertSeeds.map(({ createdMinutesAgo, ...alert }) => ({
    ...alert,
    createdAt: toIsoMinutesAgo(createdMinutesAgo),
  }));
}

export function getIotHealthDashboard(): IotDashboard {
  const devices = getIotDevices();
  const alerts = getIotAlerts();
  const batteryDevices = devices.filter(device => device.battery !== null);
  const online = devices.filter(device => device.status === 'online').length;
  const warning = devices.filter(device => device.status === 'warning').length;
  const offline = devices.filter(device => device.status === 'offline').length;
  const maintenance = devices.filter(device => device.status === 'maintenance').length;
  const activeAlerts = alerts.filter(alert => alert.status !== 'resolved');
  const weightedHealthy = online + warning * 0.6;

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      totalDevices: devices.length,
      online,
      warning,
      offline,
      maintenance,
      availabilityRate: Math.round((weightedHealthy / devices.length) * 100),
      averageBattery: Math.round(
        batteryDevices.reduce((total, device) => total + (device.battery ?? 0), 0) / batteryDevices.length,
      ),
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter(alert => alert.severity === 'critical').length,
    },
    devices,
    alerts,
  };
}

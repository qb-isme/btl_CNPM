// Mock Data Store for Parking System

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

// ─── Gate Operations (Module 5) ──────────────────────────────────────────────

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
    cardStatus: 'damaged',
  },
  {
    id: 'sess-003',
    licensePlate: '30F-99887',
    cardId: null,
    userType: 'guest',
    ownerName: 'Khách vãng lai',
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

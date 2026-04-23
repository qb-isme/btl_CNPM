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

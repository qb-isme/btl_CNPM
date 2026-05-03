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

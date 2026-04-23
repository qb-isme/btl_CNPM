import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

// Mock Data - Zones
const zones = [
  { id: 'zone-a', name: 'Khu A', totalSlots: 100, status: 'active' },
  { id: 'zone-b', name: 'Khu B', totalSlots: 100, status: 'active' },
  { id: 'zone-c', name: 'Khu C', totalSlots: 100, status: 'active' },
  { id: 'zone-d', name: 'Khu D', totalSlots: 100, status: 'maintenance' },
  { id: 'zone-e', name: 'Khu E', totalSlots: 100, status: 'active' },
  { id: 'zone-f', name: 'Khu F', totalSlots: 100, status: 'active' },
];

// Generate parking slots for each zone
const generateSlots = (zoneId, rows, cols, occupiedCount) => {
  const slots = [];
  let slotNumber = 1;
  const occupiedSlots = new Set();
  
  // Randomly select occupied slots
  while (occupiedSlots.size < occupiedCount) {
    occupiedSlots.add(Math.floor(Math.random() * (rows * cols)) + 1);
  }
  
  for (let row = 1; row <= rows; row++) {
    for (let col = 1; col <= cols; col++) {
      slots.push({
        id: `${zoneId}-slot-${slotNumber}`,
        zoneId,
        slotNumber,
        row,
        col,
        status: occupiedSlots.has(slotNumber) ? 'occupied' : 'available',
      });
      slotNumber++;
    }
  }
  return slots;
};

// Initialize parking slots with different occupancy rates
const parkingSlots = {
  'zone-a': generateSlots('zone-a', 10, 10, 55), // 45/100 available
  'zone-b': generateSlots('zone-b', 10, 10, 10), // 90/100 available
  'zone-c': generateSlots('zone-c', 10, 10, 100), // 0/100 available (full)
  'zone-d': generateSlots('zone-d', 10, 10, 0), // maintenance
  'zone-e': generateSlots('zone-e', 10, 10, 0), // 100/100 available (empty)
  'zone-f': generateSlots('zone-f', 10, 10, 70), // 30/100 available
};

// API Routes

// Get all zones with occupancy info
app.get('/api/zones', (req, res) => {
  const zonesWithOccupancy = zones.map(zone => {
    const slots = parkingSlots[zone.id] || [];
    const availableSlots = slots.filter(s => s.status === 'available').length;
    const occupiedSlots = slots.filter(s => s.status === 'occupied').length;
    
    return {
      ...zone,
      availableSlots,
      occupiedSlots,
      occupancyRate: zone.status === 'maintenance' ? null : Math.round((occupiedSlots / zone.totalSlots) * 100),
    };
  });
  
  res.json(zonesWithOccupancy);
});

// Get single zone
app.get('/api/zones/:id', (req, res) => {
  const zone = zones.find(z => z.id === req.params.id);
  if (!zone) {
    return res.status(404).json({ error: 'Zone not found' });
  }
  
  const slots = parkingSlots[zone.id] || [];
  const availableSlots = slots.filter(s => s.status === 'available').length;
  const occupiedSlots = slots.filter(s => s.status === 'occupied').length;
  
  res.json({
    ...zone,
    availableSlots,
    occupiedSlots,
    occupancyRate: zone.status === 'maintenance' ? null : Math.round((occupiedSlots / zone.totalSlots) * 100),
  });
});

// Get slots for a zone
app.get('/api/zones/:id/slots', (req, res) => {
  const zone = zones.find(z => z.id === req.params.id);
  if (!zone) {
    return res.status(404).json({ error: 'Zone not found' });
  }
  
  const slots = parkingSlots[zone.id] || [];
  res.json(slots);
});

// Update slot status
app.patch('/api/slots/:id', (req, res) => {
  const { status } = req.body;
  const slotId = req.params.id;
  
  for (const zoneId in parkingSlots) {
    const slot = parkingSlots[zoneId].find(s => s.id === slotId);
    if (slot) {
      slot.status = status;
      return res.json(slot);
    }
  }
  
  res.status(404).json({ error: 'Slot not found' });
});

// Check in vehicle
app.post('/api/checkin', (req, res) => {
  const { slotId, licensePlate, vehicleType } = req.body;
  
  for (const zoneId in parkingSlots) {
    const slot = parkingSlots[zoneId].find(s => s.id === slotId);
    if (slot) {
      if (slot.status !== 'available') {
        return res.status(400).json({ error: 'Slot is not available' });
      }
      slot.status = 'occupied';
      slot.vehicle = { licensePlate, vehicleType, checkInTime: new Date() };
      return res.json({ success: true, slot });
    }
  }
  
  res.status(404).json({ error: 'Slot not found' });
});

// Check out vehicle
app.post('/api/checkout', (req, res) => {
  const { slotId } = req.body;
  
  for (const zoneId in parkingSlots) {
    const slot = parkingSlots[zoneId].find(s => s.id === slotId);
    if (slot) {
      if (slot.status !== 'occupied') {
        return res.status(400).json({ error: 'Slot is not occupied' });
      }
      const checkInTime = slot.vehicle?.checkInTime;
      const checkOutTime = new Date();
      const duration = checkInTime ? Math.ceil((checkOutTime - new Date(checkInTime)) / (1000 * 60 * 60)) : 1;
      const fee = duration * 10000; // 10,000 VND per hour
      
      slot.status = 'available';
      const vehicle = slot.vehicle;
      delete slot.vehicle;
      
      return res.json({ 
        success: true, 
        slot,
        vehicle,
        duration,
        fee,
        checkOutTime
      });
    }
  }
  
  res.status(404).json({ error: 'Slot not found' });
});

// Search zones
app.get('/api/search', (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.json(zones);
  }
  
  const filtered = zones.filter(zone => 
    zone.name.toLowerCase().includes(q.toLowerCase())
  );
  
  res.json(filtered);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

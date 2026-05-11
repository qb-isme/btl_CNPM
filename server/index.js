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
// ==============================================================
// 1. MẢNG DỮ LIỆU TÀI KHOẢN (MỚI THÊM VÀO)
// ==============================================================
const users = [
  // Ban quản lý: quản lý chính sách định giá, báo cáo và xem tổng quan bãi đỗ
  { username: 'bql01', password: '123', name: 'Trần Hoàng Quốc Bảo', role: 'Ban quản lý' },
  // IT: quản lý phân quyền và tài khoản nội bộ
  { username: 'it01', password: '123', name: 'Nhân viên IT', role: 'IT' },
  // Vận hành / Bảo vệ: vận hành cổng, tiếp nhận sự cố, cấu hình bãi đỗ
  { username: 'bv01', password: '123', name: 'Nguyễn Văn Bảo Vệ', role: 'Vận hành' },
  // Sinh viên: người dùng nội bộ, được dùng bản đồ, thanh toán và lịch sử giao dịch
  { username: 'sv01', password: '123', name: 'Sinh viên Test', role: 'Sinh viên' },
  // Giảng viên/Cán bộ: tính là một role chung của người dùng nội bộ
  { username: 'gvcb01', password: '123', name: 'Giảng viên/Cán bộ Test', role: 'Giảng viên/Cán bộ' },
  // Giữ thêm tài khoản test cũ nếu bạn đã quen dùng, nhưng role vẫn là một nhóm chung
  { username: 'gv01', password: '123', name: 'Giảng viên Test', role: 'Giảng viên/Cán bộ' },
  { username: 'cb01', password: '123', name: 'Cán bộ Test', role: 'Giảng viên/Cán bộ' }
];

// ==============================================================
// 2. API ĐĂNG NHẬP (MỚI THÊM VÀO)
// ==============================================================
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // Tìm user trong mảng
  const user = users.find(u => u.username === username && u.password === password);

  if (user) {
    // Trả về thông tin user (kèm role) để Front-end lưu vào localStorage
    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      user: {
        name: user.name,
        role: user.role,
        username: user.username
      }
    });
  } else {
    return res.status(401).json({
      success: false,
      message: 'Tài khoản hoặc mật khẩu không chính xác'
    });
  }
});

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



// ==============================================================
// 3. MOCK DATA & API CHO UC7 - BÁO CÁO, HEATMAP, ĐỐI SOÁT BKPAY
// ==============================================================
const reconciliationTransactions = [
  { id: 'BKP-1001', time: '2026-05-11 08:30', amount: 5000, internalStatus: 'Thành công', bkpayStatus: 'Thành công', status: 'match' },
  { id: 'BKP-1002', time: '2026-05-11 09:15', amount: 10000, internalStatus: 'Thành công', bkpayStatus: 'Thành công', status: 'match' },
  { id: 'BKP-1003', time: '2026-05-11 10:00', amount: 5000, internalStatus: 'Thành công', bkpayStatus: 'Chưa thanh toán', status: 'mismatch' },
  { id: 'BKP-1004', time: '2026-05-11 10:45', amount: 20000, internalStatus: 'Thành công', bkpayStatus: 'Thành công', status: 'match' },
  { id: 'BKP-1005', time: '2026-05-11 11:20', amount: 5000, internalStatus: 'Lỗi hệ thống', bkpayStatus: 'Thành công', status: 'mismatch' },
];

const heatmapReport = [
  { hour: '07:00', occupancy: 45 },
  { hour: '08:00', occupancy: 85 },
  { hour: '09:00', occupancy: 98 },
  { hour: '10:00', occupancy: 95 },
  { hour: '11:00', occupancy: 70 },
  { hour: '12:00', occupancy: 60 },
  { hour: '13:00', occupancy: 80 },
  { hour: '14:00', occupancy: 92 },
];

app.get('/api/reports/reconciliation', (req, res) => {
  const period = req.query.period || 'day';
  const totalInternal = reconciliationTransactions
    .filter(transaction => transaction.internalStatus === 'Thành công')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const actualRevenue = reconciliationTransactions
    .filter(transaction => transaction.bkpayStatus === 'Thành công')
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const matched = reconciliationTransactions.filter(transaction => transaction.status === 'match').length;
  const mismatched = reconciliationTransactions.filter(transaction => transaction.status === 'mismatch').length;

  res.json({
    period,
    summary: {
      totalInternal,
      actualRevenue,
      matched,
      mismatched,
      matchRate: Math.round((matched / reconciliationTransactions.length) * 100),
      status: mismatched === 0 ? 'matched' : 'pending',
    },
    transactions: reconciliationTransactions,
  });
});

app.post('/api/reports/reconciliation/instant', (req, res) => {
  res.status(202).json({
    success: true,
    message: 'Hệ thống đang tiến hành đối soát ngầm, vui lòng xem kết quả tại tab Lịch sử sau ít phút',
    queueId: `BKPAY-JOB-${Date.now()}`,
  });
});

app.post('/api/reports/reconciliation/:id/manual-review', (req, res) => {
  const transaction = reconciliationTransactions.find(item => item.id === req.params.id);
  if (!transaction) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy giao dịch' });
  }

  transaction.note = req.body.note || 'Yêu cầu kiểm tra thủ công';
  transaction.reviewStatus = 'pending';

  res.json({
    success: true,
    message: 'Đã khởi tạo yêu cầu kiểm tra thủ công',
    transaction,
  });
});

app.get('/api/reports/heatmap', (req, res) => {
  res.json({
    campus: req.query.campus || 'Cơ sở 1',
    floor: req.query.floor || 'Tổng thể',
    range: req.query.range || 'Tuần học tập',
    summary: {
      averageOccupancy: 78,
      peakHour: '09:00 - 10:30',
      hottestZone: 'Khu A',
      warning: 'Dữ liệu khu D có thể không chính xác do cảm biến mất tín hiệu',
    },
    data: heatmapReport,
  });
});

app.post('/api/reports/export', (req, res) => {
  const format = req.body.format || 'PDF';
  const reportType = req.body.reportType || 'UC7';

  res.json({
    success: true,
    message: `Đã ghi nhận yêu cầu xuất báo cáo ${format}`,
    reportType,
    fileName: `${reportType}_${Date.now()}.${String(format).toLowerCase()}`,
  });
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

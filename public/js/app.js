// API Base URL
const API_BASE = '/api';

// State
let currentZone = null;
let selectedSlot = null;
let zones = [];
let currentSlots = [];

// DOM Elements
const zonesGrid = document.getElementById('zonesGrid');
const searchInput = document.getElementById('searchInput');
const zoneDetailModal = document.getElementById('zoneDetailModal');
const slotsContainer = document.getElementById('slotsContainer');
const checkInOutModal = document.getElementById('checkInOutModal');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  updateTime();
  setInterval(updateTime, 1000);
  loadZones();
  setupEventListeners();
});

// Update current time
function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
  document.getElementById('currentTime').textContent = timeStr;
}

// Setup event listeners
function setupEventListeners() {
  // Search input
  searchInput.addEventListener('input', (e) => {
    filterZones(e.target.value);
  });

  // Check in/out form
  document.getElementById('confirmCheckInOutBtn').addEventListener('click', handleCheckInOut);

  // Modal events
  zoneDetailModal.addEventListener('hidden.bs.modal', () => {
    selectedSlot = null;
    currentZone = null;
  });
}

// Load all zones
async function loadZones() {
  try {
    zonesGrid.innerHTML = `
      <div class="loading-spinner col-span-3">
        <div class="spinner-border text-light" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>
    `;

    const response = await fetch(`${API_BASE}/zones`);
    zones = await response.json();
    renderZones(zones);
  } catch (error) {
    console.error('Error loading zones:', error);
    zonesGrid.innerHTML = `
      <div class="col-span-3 text-center text-danger">
        <i class="bi bi-exclamation-triangle"></i> Không thể tải dữ liệu
      </div>
    `;
  }
}

// Render zones grid
function renderZones(zonesToRender) {
  zonesGrid.innerHTML = zonesToRender.map(zone => {
    let statusClass = 'available';
    let displayCount = `${zone.availableSlots}/${zone.totalSlots}`;
    
    if (zone.status === 'maintenance') {
      statusClass = 'maintenance';
      displayCount = '--/100';
    } else if (zone.availableSlots === 0) {
      statusClass = 'full';
    } else if (zone.occupancyRate >= 80) {
      statusClass = 'almost-full';
    } else if (zone.availableSlots === zone.totalSlots) {
      statusClass = 'empty';
    }

    return `
      <div class="zone-card ${statusClass}" 
           onclick="openZoneDetail('${zone.id}')"
           ${zone.status === 'maintenance' ? 'style="pointer-events: none;"' : ''}>
        <div class="zone-name">${zone.name}</div>
        <div class="zone-count">${displayCount}</div>
      </div>
    `;
  }).join('');
}

// Filter zones by search
function filterZones(query) {
  if (!query) {
    renderZones(zones);
    return;
  }
  
  const filtered = zones.filter(zone => 
    zone.name.toLowerCase().includes(query.toLowerCase())
  );
  renderZones(filtered);
}

// Open zone detail modal
async function openZoneDetail(zoneId) {
  try {
    currentZone = zones.find(z => z.id === zoneId);
    if (!currentZone || currentZone.status === 'maintenance') return;

    // Update modal header info
    document.getElementById('zoneDetailName').textContent = `Bản đồ chi tiết ${currentZone.name}`;
    document.getElementById('zoneNameHeader').textContent = currentZone.name.toUpperCase();
    document.getElementById('zoneDetailAvailable').textContent = `${currentZone.availableSlots}/${currentZone.totalSlots}`;
    document.getElementById('zoneDetailStatus').textContent = 'đang hoạt động';
    document.getElementById('zoneDetailStatus').className = 'badge bg-success';
    
    // Reset selected slot info
    document.getElementById('selectedSlotInfo').innerHTML = '<span class="text-muted">Nhấp vào vị trí trống trên bản đồ</span>';
    document.getElementById('startDirectionBtn').disabled = true;

    // Load slots
    const response = await fetch(`${API_BASE}/zones/${zoneId}/slots`);
    currentSlots = await response.json();
    renderSlots(currentSlots);

    // Show modal
    const modal = new bootstrap.Modal(zoneDetailModal);
    modal.show();
  } catch (error) {
    console.error('Error loading zone detail:', error);
    showToast('Không thể tải thông tin khu vực', 'danger');
  }
}

// Render slots in the detail view
function renderSlots(slots) {
  // Organize slots into columns (2 columns per side with divider in middle)
  const leftColumn1 = slots.filter(s => s.col <= 2);
  const leftColumn2 = slots.filter(s => s.col > 2 && s.col <= 4);
  const rightColumn1 = slots.filter(s => s.col > 4 && s.col <= 6);
  const rightColumn2 = slots.filter(s => s.col > 6);

  // For display, we'll show a simplified grid layout
  const rows = 10;
  const slotsPerRow = 2;
  
  let html = '<div class="d-flex gap-4 justify-content-center">';
  
  // Left side
  html += '<div class="slots-column">';
  for (let i = 0; i < Math.min(rows, slots.length / 4); i++) {
    const slot = slots[i];
    if (slot) {
      html += renderSlot(slot);
    }
  }
  html += '</div>';

  // Divider
  html += '<div class="slots-divider"></div>';

  // Right side
  html += '<div class="slots-column">';
  for (let i = Math.floor(slots.length / 2); i < Math.min(Math.floor(slots.length / 2) + rows, slots.length); i++) {
    const slot = slots[i];
    if (slot) {
      html += renderSlot(slot);
    }
  }
  html += '</div>';

  html += '</div>';

  slotsContainer.innerHTML = html;
}

// Render single slot
function renderSlot(slot) {
  const statusClass = slot.status;
  const isSelected = selectedSlot && selectedSlot.id === slot.id;
  const icon = slot.status === 'occupied' ? '<i class="bi bi-car-front-fill"></i>' : 'Vị trí';
  
  return `
    <div class="slot ${statusClass} ${isSelected ? 'selected' : ''}" 
         onclick="selectSlot('${slot.id}')"
         data-slot-id="${slot.id}">
      ${icon}
    </div>
  `;
}

// Select a slot
function selectSlot(slotId) {
  const slot = currentSlots.find(s => s.id === slotId);
  if (!slot) return;

  selectedSlot = slot;
  
  // Update UI
  document.querySelectorAll('.slot').forEach(el => el.classList.remove('selected'));
  document.querySelector(`[data-slot-id="${slotId}"]`)?.classList.add('selected');
  
  // Update selected slot info
  const infoEl = document.getElementById('selectedSlotInfo');
  
  if (slot.status === 'available') {
    infoEl.innerHTML = `
      <div class="text-center">
        <i class="bi bi-check-circle text-success fs-4"></i>
        <p class="mb-0 mt-2"><strong>Vị trí ${slot.slotNumber}</strong></p>
        <small class="text-success">Còn trống</small>
        <button class="btn btn-success btn-sm mt-2 w-100" onclick="openCheckIn()">
          <i class="bi bi-box-arrow-in-right me-1"></i>Check In
        </button>
      </div>
    `;
    document.getElementById('startDirectionBtn').disabled = false;
  } else if (slot.status === 'occupied') {
    const vehicle = slot.vehicle || {};
    infoEl.innerHTML = `
      <div class="text-center">
        <i class="bi bi-car-front text-danger fs-4"></i>
        <p class="mb-0 mt-2"><strong>Vị trí ${slot.slotNumber}</strong></p>
        <small class="text-danger">Đã có xe</small>
        ${vehicle.licensePlate ? `<p class="small mb-0">Biển số: ${vehicle.licensePlate}</p>` : ''}
        <button class="btn btn-warning btn-sm mt-2 w-100" onclick="openCheckOut()">
          <i class="bi bi-box-arrow-right me-1"></i>Check Out
        </button>
      </div>
    `;
    document.getElementById('startDirectionBtn').disabled = true;
  }
}

// Open check in modal
function openCheckIn() {
  if (!selectedSlot || selectedSlot.status !== 'available') return;
  
  document.getElementById('checkInOutTitle').textContent = `Check In - Vị trí ${selectedSlot.slotNumber}`;
  document.getElementById('slotIdInput').value = selectedSlot.id;
  document.getElementById('checkInOutForm').classList.remove('d-none');
  document.getElementById('checkOutInfo').classList.add('d-none');
  document.getElementById('licensePlateInput').value = '';
  document.getElementById('confirmCheckInOutBtn').textContent = 'Xác nhận Check In';
  document.getElementById('confirmCheckInOutBtn').setAttribute('data-action', 'checkin');
  
  const modal = new bootstrap.Modal(checkInOutModal);
  modal.show();
}

// Open check out modal
function openCheckOut() {
  if (!selectedSlot || selectedSlot.status !== 'occupied') return;
  
  const vehicle = selectedSlot.vehicle || {};
  
  document.getElementById('checkInOutTitle').textContent = `Check Out - Vị trí ${selectedSlot.slotNumber}`;
  document.getElementById('slotIdInput').value = selectedSlot.id;
  document.getElementById('checkInOutForm').classList.add('d-none');
  document.getElementById('checkOutInfo').classList.remove('d-none');
  
  document.getElementById('checkOutLicensePlate').textContent = vehicle.licensePlate || 'N/A';
  document.getElementById('checkOutTimeIn').textContent = vehicle.checkInTime 
    ? new Date(vehicle.checkInTime).toLocaleString('vi-VN') 
    : 'N/A';
  document.getElementById('checkOutFee').textContent = 'Đang tính...';
  
  document.getElementById('confirmCheckInOutBtn').textContent = 'Xác nhận Check Out';
  document.getElementById('confirmCheckInOutBtn').setAttribute('data-action', 'checkout');
  
  const modal = new bootstrap.Modal(checkInOutModal);
  modal.show();
}

// Handle check in/out
async function handleCheckInOut() {
  const action = document.getElementById('confirmCheckInOutBtn').getAttribute('data-action');
  const slotId = document.getElementById('slotIdInput').value;
  
  try {
    if (action === 'checkin') {
      const licensePlate = document.getElementById('licensePlateInput').value;
      const vehicleType = document.getElementById('vehicleTypeInput').value;
      
      if (!licensePlate) {
        showToast('Vui lòng nhập biển số xe', 'warning');
        return;
      }
      
      const response = await fetch(`${API_BASE}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, licensePlate, vehicleType })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showToast('Check in thành công!', 'success');
        bootstrap.Modal.getInstance(checkInOutModal).hide();
        
        // Update local state
        const slot = currentSlots.find(s => s.id === slotId);
        if (slot) {
          slot.status = 'occupied';
          slot.vehicle = { licensePlate, vehicleType, checkInTime: new Date() };
        }
        
        // Refresh views
        renderSlots(currentSlots);
        await loadZones();
        
        // Update zone info
        if (currentZone) {
          currentZone.availableSlots--;
          document.getElementById('zoneDetailAvailable').textContent = 
            `${currentZone.availableSlots}/${currentZone.totalSlots}`;
        }
      } else {
        showToast(result.error || 'Có lỗi xảy ra', 'danger');
      }
    } else if (action === 'checkout') {
      const response = await fetch(`${API_BASE}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId })
      });
      
      const result = await response.json();
      
      if (response.ok) {
        const feeFormatted = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND'
        }).format(result.fee);
        
        showToast(`Check out thành công! Phí: ${feeFormatted}`, 'success');
        bootstrap.Modal.getInstance(checkInOutModal).hide();
        
        // Update local state
        const slot = currentSlots.find(s => s.id === slotId);
        if (slot) {
          slot.status = 'available';
          delete slot.vehicle;
        }
        
        // Refresh views
        renderSlots(currentSlots);
        await loadZones();
        
        // Update zone info
        if (currentZone) {
          currentZone.availableSlots++;
          document.getElementById('zoneDetailAvailable').textContent = 
            `${currentZone.availableSlots}/${currentZone.totalSlots}`;
        }
      } else {
        showToast(result.error || 'Có lỗi xảy ra', 'danger');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Có lỗi xảy ra khi xử lý', 'danger');
  }
}

// Show toast notification
function showToast(message, type = 'info') {
  // Create toast container if not exists
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toastId = 'toast-' + Date.now();
  const bgClass = {
    success: 'bg-success',
    danger: 'bg-danger',
    warning: 'bg-warning',
    info: 'bg-info'
  }[type] || 'bg-info';
  
  const toastHtml = `
    <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;
  
  container.insertAdjacentHTML('beforeend', toastHtml);
  
  const toastEl = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastEl, { delay: 3000 });
  toast.show();
  
  toastEl.addEventListener('hidden.bs.toast', () => {
    toastEl.remove();
  });
}

'use client';

import { useState, useEffect, useCallback } from 'react';

interface Slot {
  id: string;
  slotNumber: number;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  vehicle?: {
    licensePlate: string;
    vehicleType: string;
    checkInTime: string;
  };
}

interface Zone {
  id: string;
  name: string;
  totalSlots: number;
  availableSlots: number;
  status: string;
}

interface ZoneDetailModalProps {
  zone: Zone | null;
  isOpen: boolean;
  onClose: () => void;
  onRefreshZones: () => void;
}

export default function ZoneDetailModal({ zone, isOpen, onClose, onRefreshZones }: ZoneDetailModalProps) {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [licensePlate, setLicensePlate] = useState('');
  const [vehicleType, setVehicleType] = useState('car');
  const [zoneInfo, setZoneInfo] = useState<Zone | null>(null);

  const loadSlots = useCallback(async () => {
    if (!zone) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/zones/${zone.id}/slots`);
      const data = await response.json();
      setSlots(data);
      
      // Also refresh zone info
      const zoneResponse = await fetch(`/api/zones/${zone.id}`);
      const zoneData = await zoneResponse.json();
      setZoneInfo(zoneData);
    } catch (error) {
      console.error('Error loading slots:', error);
    } finally {
      setLoading(false);
    }
  }, [zone]);

  useEffect(() => {
    if (isOpen && zone) {
      loadSlots();
      setSelectedSlot(null);
      setZoneInfo(zone);
    }
  }, [isOpen, zone, loadSlots]);

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
  };

  const handleCheckIn = async () => {
    if (!selectedSlot || !licensePlate) return;
    
    try {
      const response = await fetch('/api/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          licensePlate,
          vehicleType,
        }),
      });
      
      if (response.ok) {
        setShowCheckInModal(false);
        setLicensePlate('');
        setSelectedSlot(null);
        await loadSlots();
        onRefreshZones();
        showToast('Check in thanh cong!', 'success');
      } else {
        const data = await response.json();
        showToast(data.error || 'Co loi xay ra', 'danger');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      showToast('Co loi xay ra', 'danger');
    }
  };

  const handleCheckOut = async () => {
    if (!selectedSlot) return;
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId: selectedSlot.id }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const feeFormatted = new Intl.NumberFormat('vi-VN', {
          style: 'currency',
          currency: 'VND',
        }).format(data.fee);
        
        setShowCheckOutModal(false);
        setSelectedSlot(null);
        await loadSlots();
        onRefreshZones();
        showToast(`Check out thanh cong! Phi: ${feeFormatted}`, 'success');
      } else {
        const data = await response.json();
        showToast(data.error || 'Co loi xay ra', 'danger');
      }
    } catch (error) {
      console.error('Error checking out:', error);
      showToast('Co loi xay ra', 'danger');
    }
  };

  const showToast = (message: string, type: string) => {
    const container = document.querySelector('.toast-container') || (() => {
      const div = document.createElement('div');
      div.className = 'toast-container';
      document.body.appendChild(div);
      return div;
    })();
    
    const toastId = `toast-${Date.now()}`;
    const bgClass = type === 'success' ? 'bg-success' : type === 'danger' ? 'bg-danger' : 'bg-info';
    
    const toastHtml = `
      <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0 show" role="alert">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" onclick="this.closest('.toast').remove()"></button>
        </div>
      </div>
    `;
    
    container.insertAdjacentHTML('beforeend', toastHtml);
    setTimeout(() => document.getElementById(toastId)?.remove(), 3000);
  };

  // Organize slots into left and right columns
  const leftSlots = slots.filter((_, idx) => idx < 10);
  const rightSlots = slots.filter((_, idx) => idx >= slots.length / 2 && idx < slots.length / 2 + 10);

  if (!isOpen || !zone) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-xl">
          <div className="modal-content">
            <div className="modal-header bg-primary text-white">
              <h5 className="modal-title">
                <i className="bi bi-arrow-left me-2" role="button" onClick={onClose}></i>
                Quay lai so do tong
              </h5>
              <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
            </div>
            <div className="modal-body p-0">
              <div className="row g-0">
                {/* Zone Info Sidebar */}
                <div className="col-md-3 border-end p-4">
                  <div className="zone-info-card">
                    <div className="d-flex align-items-center mb-3">
                      <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                      <h6 className="mb-0">Ban do chi tiet {zone.name}</h6>
                    </div>
                    <p className="text-muted small mb-2">Cho trong khu vuc nay:</p>
                    <h4 className="text-primary">
                      {zoneInfo?.availableSlots ?? zone.availableSlots}/{zoneInfo?.totalSlots ?? zone.totalSlots}
                    </h4>
                    <p className="mb-1">Trang thai:</p>
                    <span className="badge bg-success">dang hoat dong</span>
                    
                    <hr />
                    
                    <h6>Vi tri da chon:</h6>
                    <div className="selected-slot-info p-3 bg-light rounded">
                      {selectedSlot ? (
                        <div className="text-center">
                          <i className={`bi ${selectedSlot.status === 'available' ? 'bi-check-circle text-success' : 'bi-car-front text-danger'} fs-4`}></i>
                          <p className="mb-0 mt-2"><strong>Vi tri {selectedSlot.slotNumber}</strong></p>
                          <small className={selectedSlot.status === 'available' ? 'text-success' : 'text-danger'}>
                            {selectedSlot.status === 'available' ? 'Con trong' : 'Da co xe'}
                          </small>
                          {selectedSlot.vehicle && (
                            <p className="small mb-0 mt-1">Bien so: {selectedSlot.vehicle.licensePlate}</p>
                          )}
                          <button
                            className={`btn btn-sm mt-2 w-100 ${selectedSlot.status === 'available' ? 'btn-success' : 'btn-warning'}`}
                            onClick={() => selectedSlot.status === 'available' ? setShowCheckInModal(true) : setShowCheckOutModal(true)}
                          >
                            <i className={`bi ${selectedSlot.status === 'available' ? 'bi-box-arrow-in-right' : 'bi-box-arrow-right'} me-1`}></i>
                            {selectedSlot.status === 'available' ? 'Check In' : 'Check Out'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">Nhap vao vi tri trong tren ban do</span>
                      )}
                    </div>
                    
                    <button className="btn btn-outline-primary w-100 mt-3" disabled={!selectedSlot || selectedSlot.status !== 'available'}>
                      <i className="bi bi-signpost-2 me-2"></i>BAT DAU CHI DUONG
                    </button>
                  </div>
                </div>
                
                {/* Slots Grid */}
                <div className="col-md-9 bg-dark p-4">
                  <h5 className="text-center text-white mb-4">
                    BAN DO CHI TIET: <span className="text-info">{zone.name.toUpperCase()}</span>
                  </h5>
                  
                  {loading ? (
                    <div className="d-flex justify-content-center py-5">
                      <div className="spinner-border text-light" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="slots-container">
                      <div className="slots-column">
                        {leftSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`slot ${slot.status} ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                            onClick={() => handleSlotClick(slot)}
                          >
                            {slot.status === 'occupied' ? <i className="bi bi-car-front-fill"></i> : 'Vi tri'}
                          </div>
                        ))}
                      </div>
                      
                      <div className="slots-divider"></div>
                      
                      <div className="slots-column">
                        {rightSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className={`slot ${slot.status} ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                            onClick={() => handleSlotClick(slot)}
                          >
                            {slot.status === 'occupied' ? <i className="bi bi-car-front-fill"></i> : 'Vi tri'}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center mt-4">
                    <button className="btn btn-outline-light">
                      CONG VAO PHAN KHU
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Check In Modal */}
      {showCheckInModal && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Check In - Vi tri {selectedSlot?.slotNumber}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCheckInModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Bien so xe</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="VD: 30A-12345"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Loai xe</label>
                  <select className="form-select" value={vehicleType} onChange={(e) => setVehicleType(e.target.value)}>
                    <option value="car">O to</option>
                    <option value="motorcycle">Xe may</option>
                    <option value="truck">Xe tai</option>
                    <option value="bus">Xe buyt</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCheckInModal(false)}>Huy</button>
                <button type="button" className="btn btn-primary" onClick={handleCheckIn}>Xac nhan Check In</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check Out Modal */}
      {showCheckOutModal && selectedSlot && (
        <div className="modal fade show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Check Out - Vi tri {selectedSlot.slotNumber}</h5>
                <button type="button" className="btn-close" onClick={() => setShowCheckOutModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <p><strong>Bien so:</strong> {selectedSlot.vehicle?.licensePlate || 'N/A'}</p>
                  <p><strong>Thoi gian vao:</strong> {selectedSlot.vehicle?.checkInTime ? new Date(selectedSlot.vehicle.checkInTime).toLocaleString('vi-VN') : 'N/A'}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCheckOutModal(false)}>Huy</button>
                <button type="button" className="btn btn-warning" onClick={handleCheckOut}>Xac nhan Check Out</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client"

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Search, MapPin, Navigation, Map as MapIcon, User, ShieldAlert, ArrowLeft, Car, X } from 'lucide-react';

// Dynamic import for GPS Map (client-side only)
const GPSMap = dynamic(() => import('@/components/GPSMap'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#1E293B]">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p>Đang tải bản đồ GPS...</p>
      </div>
    </div>
  )
});

// Mock Data cho các phân khu bãi xe
const initialZones = [
  { id: 'A', name: 'Khu A (Gần cổng)', status: 'green', spots: '45/100', type: 'Sinh viên' },
  { id: 'B', name: 'Khu B (Trung tâm)', status: 'yellow', spots: '90/100', type: 'Sinh viên' },
  { id: 'C', name: 'Khu C (Căn tin)', status: 'red', spots: '100/100', type: 'Sinh viên' },
  { id: 'D', name: 'Khu D (Khuất)', status: 'gray', spots: '--/100', type: 'Sinh viên', note: 'Mất kết nối IoT' },
  { id: 'E', name: 'Khu Cán bộ GV', status: 'maintenance', spots: '0/50', type: 'Cán bộ', note: 'Đang bảo trì' },
  { id: 'F', name: 'Khu F (Mở rộng)', status: 'green', spots: '10/150', type: 'Sinh viên' },
];

type Zone = typeof initialZones[number];
type Slot = { id: string; name: string; isOccupied: boolean };
type ViewMode = 'overview' | 'zoneDetail';
type RouteStatus = 'gps' | 'default' | null;

export default function ParkingApp() {
  const [zones] = useState(initialZones);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<Zone | null>(null);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [routeStatus, setRouteStatus] = useState<RouteStatus>(null);
  const [currentTime, setCurrentTime] = useState('');

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [currentZoneSlots, setCurrentZoneSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [showGPSMap, setShowGPSMap] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const filteredZones = zones.filter(zone => 
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generateSlots = (zoneId: string): Slot[] => {
    return Array.from({ length: 12 }).map((_, i) => ({
      id: `${zoneId}-${i + 1}`,
      name: `Vị trí ${i + 1}`,
      isOccupied: i % 3 === 0 
    }));
  };

  const handleZoneClick = (zone: Zone) => {
    setRouteStatus(null);
    if (zone.status === 'gray') return;
    if (zone.status === 'maintenance') {
      setShowWarningModal(true);
      return;
    }
    setSelectedZone(zone);
    setCurrentZoneSlots(generateSlots(zone.id));
    setViewMode('zoneDetail');
    setSelectedSlot(null);
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedZone(null);
    setSelectedSlot(null);
    setRouteStatus(null);
  };

  const handleSlotClick = (slot: Slot) => {
    if (slot.isOccupied) return;
    setSelectedSlot(slot);
    setRouteStatus(null);
  };

  const handleStartNavigation = () => {
    if (!selectedSlot) return;
    setShowGPSModal(true);
  };

  const handleGPSAllow = () => {
    setShowGPSModal(false);
    setRouteStatus('gps');
    setShowGPSMap(true);
  };

  const handleGPSDeny = () => {
    setShowGPSModal(false);
    setRouteStatus('default'); 
  };

  const getZoneColor = (status: string) => {
    switch(status) {
      case 'green': return 'bg-[#10B981] text-white'; 
      case 'yellow': return 'bg-[#F59E0B] text-white'; 
      case 'red': return 'bg-[#EF4444] text-white'; 
      case 'gray': return 'bg-[#94A3B8] text-white cursor-not-allowed opacity-70'; 
      case 'maintenance': return 'bg-stripes border-2 border-dashed border-[#EF4444] text-[#1E293B] bg-red-50'; 
      default: return 'bg-white';
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B]">
      {/* Header */}
      <header className="bg-[#E2E8F0] p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Hệ Thống Quản Lý Bãi Xe</h1>
            <p className="text-sm font-medium text-[#64748B] uppercase tracking-wider">Bản đồ &amp; Định vị • Sinh viên</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <div className="bg-white px-6 py-2 rounded-full font-mono text-xl shadow-sm">
            {currentTime}
          </div>
          <div className="bg-[#D1FAE5] text-[#10B981] px-6 py-2 rounded-full font-semibold shadow-sm flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-[#10B981]"></div> Online
          </div>
          <div className="flex flex-col items-center ml-4">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm overflow-hidden border border-[#64748B]/20">
              <User className="text-[#0284C7]" />
            </div>
            <span className="text-[10px] font-bold mt-1">Nguyễn Văn A</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex p-6 gap-6 h-[calc(100vh-100px)]">
        {/* Sidebar */}
        <div className="w-1/3 flex flex-col gap-6">
          {viewMode === 'overview' ? (
            <>
              {/* Search Box */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#64748B]/20">
                <h2 className="text-lg font-bold mb-4 uppercase text-[#1E293B] flex items-center gap-2">
                  <Search size={20} className="text-[#0284C7]"/> Tìm kiếm khu vực
                </h2>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nhập tên phân khu..." 
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#64748B]/40 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search className="absolute left-3 top-3.5 text-[#64748B]" size={20} />
                </div>
              </div>

              {/* Legend */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#64748B]/20">
                <h2 className="text-sm font-bold mb-4 text-[#64748B] uppercase">Chú giải trạng thái</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-[#10B981]"></div> Còn chỗ</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-[#F59E0B]"></div> Gần đầy</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-[#EF4444]"></div> Hết chỗ</div>
                  <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-md bg-[#94A3B8]"></div> Mất tín hiệu</div>
                  <div className="flex items-center gap-2 col-span-2"><div className="w-4 h-4 rounded-md border-2 border-dashed border-[#EF4444] bg-red-50"></div> Bảo trì / Đóng cửa</div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Back Button */}
              <button 
                onClick={handleBackToOverview}
                className="flex items-center gap-2 text-[#64748B] hover:text-[#0284C7] font-bold transition-colors w-fit"
              >
                <ArrowLeft size={20} /> Quay lại sơ đồ tổng
              </button>

              {/* Zone Detail Info */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-[#0284C7] flex-1 flex flex-col">
                <h2 className="text-xl font-bold mb-2 text-[#0284C7] flex items-center gap-2">
                  <MapPin size={24} /> Bản đồ chi tiết {selectedZone?.name}
                </h2>
                <div className="space-y-3 mt-4 text-[#1E293B]">
                  <div className="flex justify-between border-b border-[#64748B]/20 pb-2">
                    <span className="text-[#64748B]">Chỗ trống khu vực này:</span>
                    <span className="font-bold">{selectedZone?.spots}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="font-bold text-[#1E293B] mb-2">Vị trí đã chọn:</h3>
                  {selectedSlot ? (
                    <div className="bg-[#F0F9FF] border border-[#0284C7] p-4 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#0284C7] font-bold text-lg">
                        <Car size={24} /> {selectedSlot.name}
                      </div>
                      <span className="text-xs bg-[#10B981] text-white px-2 py-1 rounded-full uppercase">Sẵn sàng</span>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-dashed border-[#64748B]/50 p-4 rounded-xl text-center text-[#64748B] text-sm">
                      Nhấp vào vị trí trống trên bản đồ.
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6">
                   <button 
                     onClick={handleStartNavigation}
                     disabled={!selectedSlot || routeStatus !== null}
                     className={`w-full py-3 px-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all
                       ${!selectedSlot || routeStatus !== null 
                         ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                         : 'bg-[#0284C7] text-white hover:bg-[#0369A1]'}`}
                   >
                     <Navigation size={20} /> 
                     {routeStatus ? 'ĐANG CHỈ ĐƯỜNG' : 'BẮT ĐẦU CHỈ ĐƯỜNG'}
                   </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Map Area */}
        <div className="w-2/3 bg-[#1E293B] rounded-2xl relative overflow-hidden flex items-center justify-center border-4 border-white shadow-lg">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          
          <div className="relative w-full h-full p-8 flex flex-col">
            {viewMode === 'overview' ? (
              <>
                {/* Overview Map Title */}
                <h2 className="absolute top-6 left-6 text-white text-xl font-bold flex items-center gap-2 opacity-80">
                  <MapIcon /> SƠ ĐỒ TỔNG THỂ
                </h2>

                {/* Main Gate Label */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-[#1E293B] px-10 py-3 rounded-full shadow-2xl font-bold z-10">
                  CỔNG CHÍNH VÀO
                </div>

                {/* Zones Grid */}
                <div className="grid grid-cols-3 grid-rows-2 gap-4 h-full pt-16 pb-24 w-full">
                  {filteredZones.map((zone) => (
                    <div 
                      key={zone.id}
                      onClick={() => handleZoneClick(zone)}
                      className={`
                        relative rounded-2xl p-4 flex flex-col justify-center items-center text-center transition-transform duration-200
                        ${getZoneColor(zone.status)}
                        ${zone.status !== 'gray' && zone.status !== 'maintenance' ? 'cursor-pointer hover:-translate-y-1' : ''}
                      `}
                    >
                      <div className="font-bold text-sm lg:text-lg mb-1 z-10 leading-tight">{zone.name}</div>
                      <div className="text-2xl lg:text-4xl font-black z-10 tracking-tight">{zone.spots}</div>
                      {zone.status === 'maintenance' && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#EF4444] opacity-20 pointer-events-none">
                          <ShieldAlert size={80} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Zone Detail Map Title */}
                <h2 className="absolute top-6 left-6 text-white text-xl font-bold flex items-center gap-2">
                  <MapIcon /> BẢN ĐỒ CHI TIẾT: <span className="text-[#0284C7]">{selectedZone?.name?.toUpperCase()}</span>
                </h2>

                {/* Parking Slots */}
                <div className="relative w-full flex-1 mt-16 mb-20 flex justify-between px-8 gap-8">
                  {/* Center Divider */}
                  <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-4 border-dashed border-[#64748B]/50 z-0"></div>

                  {/* Left Column */}
                  <div className="flex flex-col gap-4 z-10 w-[35%] h-full">
                    {currentZoneSlots.slice(0, 6).map((slot) => (
                      <div 
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className={`flex-1 rounded-xl border-2 flex items-center justify-center font-bold text-xl transition-all
                          ${slot.isOccupied 
                            ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] cursor-not-allowed' 
                            : selectedSlot?.id === slot.id
                              ? 'bg-[#0284C7] border-[#0284C7] text-white ring-4 ring-[#0284C7]/30 scale-105 shadow-lg'
                              : 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] cursor-pointer hover:bg-[#10B981]/40'}
                        `}
                      >
                        {slot.isOccupied ? <Car size={32} /> : slot.name}
                      </div>
                    ))}
                  </div>

                  {/* Right Column */}
                  <div className="flex flex-col gap-4 z-10 w-[35%] h-full">
                    {currentZoneSlots.slice(6, 12).map((slot) => (
                      <div 
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className={`flex-1 rounded-xl border-2 flex items-center justify-center font-bold text-xl transition-all
                          ${slot.isOccupied 
                            ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444] cursor-not-allowed' 
                            : selectedSlot?.id === slot.id
                              ? 'bg-[#0284C7] border-[#0284C7] text-white ring-4 ring-[#0284C7]/30 scale-105 shadow-lg'
                              : 'bg-[#10B981]/20 border-[#10B981] text-[#10B981] cursor-pointer hover:bg-[#10B981]/40'}
                        `}
                      >
                        {slot.isOccupied ? <Car size={32} /> : slot.name}
                      </div>
                    ))}
                  </div>
                  
                  {/* Navigation Path */}
                  {routeStatus && selectedSlot && (
                    <div className="absolute inset-0 pointer-events-none z-20">
                      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                        {(() => {
                          const index = currentZoneSlots.findIndex(s => s.id === selectedSlot.id);
                          const isLeft = index < 6;
                          const row = isLeft ? index : index - 6;
                          const targetX = isLeft ? 17.5 : 82.5; 
                          const targetY = (row * (100 / 6)) + (100 / 12);
                          const pathD = routeStatus === 'gps' 
                            ? `M 8 88 L 50 88 L 50 ${targetY} L ${targetX} ${targetY}` 
                            : `M 50 100 L 50 ${targetY} L ${targetX} ${targetY}`;
                          return (
                            <>
                              <path 
                                d={pathD} 
                                fill="none" 
                                stroke="#38BDF8" 
                                strokeWidth="1.5" 
                                vectorEffect="non-scaling-stroke" 
                                strokeDasharray="10,10" 
                                className="animate-dash" 
                              />
                              <circle cx={targetX} cy={targetY} r="2" fill="#38BDF8" className="animate-pulse" />
                            </>
                          );
                        })()}
                      </svg>
                      {/* Your Location Label */}
                      <div 
                        className="absolute bg-[#38BDF8] text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 animate-bounce"
                        style={{ 
                          left: routeStatus === 'gps' ? '8%' : '50%', 
                          bottom: routeStatus === 'gps' ? '12%' : '0%',
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                        VỊ TRÍ CỦA BẠN
                      </div>
                    </div>
                  )}
                </div>

                {/* Zone Gate Label */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white text-[#1E293B] px-10 py-3 rounded-full shadow-2xl font-bold z-10 border-t-4 border-[#0284C7]">
                  CỔNG VÀO PHÂN KHU
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* GPS Modal */}
      {showGPSModal && (
        <div className="fixed inset-0 bg-[#1E293B]/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[400px] overflow-hidden shadow-2xl p-6 text-center">
             <h3 className="font-bold text-lg mb-4">Yêu cầu truy cập vị trí</h3>
             <p className="mb-6">Hệ thống cần quyền GPS để dẫn đường chính xác.</p>
             <div className="flex gap-4">
                <button onClick={handleGPSDeny} className="flex-1 py-3 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition-colors">Từ chối</button>
                <button onClick={handleGPSAllow} className="flex-1 py-3 bg-[#0284C7] text-white rounded-xl font-bold hover:bg-[#0369A1] transition-colors">Cho phép</button>
             </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-[#1E293B]/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-[400px] p-6 text-center">
            <h3 className="font-bold text-xl mb-4 text-[#EF4444]">Khu vực bảo trì</h3>
            <p className="mb-6 text-[#64748B]">Khu vực này đang được bảo trì. Vui lòng chọn khu vực khác.</p>
            <button onClick={() => setShowWarningModal(false)} className="w-full py-3 bg-[#1E293B] text-white rounded-xl font-bold hover:bg-[#0f172a] transition-colors">Quay lại</button>
          </div>
        </div>
      )}

      {/* GPS Map Fullscreen Modal */}
      {showGPSMap && (
        <div className="fixed inset-0 z-50">
          <GPSMap 
            selectedZoneId={selectedZone?.id || null}
            selectedSlotName={selectedSlot?.name || null}
            isNavigating={routeStatus === 'gps'}
            onClose={() => setShowGPSMap(false)}
          />
        </div>
      )}
    </div>
  );
}

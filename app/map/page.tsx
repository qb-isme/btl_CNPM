"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertOctagon,
  ArrowLeft,
  Car,
  Map as MapIcon,
  MapPin,
  Navigation,
  Search,
  ShieldAlert,
} from 'lucide-react';
import Header from '@/components/parking/Header';
import { useRouter } from 'next/navigation';
import {
  INITIAL_PARKING_ZONES,
  getAvailableCount,
  getMapStatus,
  getZoneUsageText,
  readParkingZonesFromStorage,
  type ParkingSlot,
  type ParkingZone,
} from '@/lib/parking-data';

const GPSMap = dynamic(() => import('@/components/GPSMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#1E293B]">
      <div className="text-center text-white">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-white"></div>
        <p>Đang tải bản đồ GPS...</p>
      </div>
    </div>
  ),
});

type ViewMode = 'overview' | 'zoneDetail';
type RouteStatus = 'gps' | 'default' | null;
type ViewSlot = ParkingSlot & { name: string };
type SystemRole = 'Ban quản lý' | 'IT' | 'Vận hành' | 'Người dùng nội bộ' | 'Không xác định';

type StoredUser = {
  name?: string;
  role?: string;
};

function stripVietnamese(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

function normalizeRoleText(role?: string) {
  return stripVietnamese(role ?? '')
    .toLowerCase()
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeSystemRole(role?: string): SystemRole {
  const value = normalizeRoleText(role);

  if (['admin', 'ban quan ly', 'ban quan li', 'quan ly'].includes(value)) {
    return 'Ban quản lý';
  }

  if (['it', 'quan tri he thong', 'quan tri he thong phan mem'].includes(value)) {
    return 'IT';
  }

  if (
    [
      'van hanh',
      'staff',
      'nhan vien van hanh',
      'bao ve',
      'ky thuat',
      'nhan vien ky thuat',
      'ky thuat vien',
    ].includes(value)
  ) {
    return 'Vận hành';
  }

  if (
    [
      'sinh vien',
      'student',
      'hoc vien',
      'can bo',
      'giang vien',
      'can bo/giang vien',
      'giang vien/can bo',
      'can bo - giang vien',
      'giang vien - can bo',
      'can bo giang vien',
      'giang vien can bo',
      'nguoi dung noi bo',
    ].includes(value)
  ) {
    return 'Người dùng nội bộ';
  }

  return 'Không xác định';
}

function canUseUC3Navigation(role: SystemRole) {
  return role === 'Người dùng nội bộ';
}

function toViewSlots(zone: ParkingZone): ViewSlot[] {
  return zone.slots.map((slot, index) => ({
    ...slot,
    name: `Vị trí ${index + 1}`,
  }));
}

function getZoneColor(zone: ParkingZone) {
  const status = getMapStatus(zone);

  switch (status) {
    case 'green':
      return 'bg-[#10B981] text-white';
    case 'yellow':
      return 'bg-[#F59E0B] text-white';
    case 'red':
      return 'bg-[#EF4444] text-white';
    case 'gray':
      return 'cursor-not-allowed bg-[#94A3B8] text-white opacity-70';
    case 'maintenance':
      return 'bg-stripes border-2 border-dashed border-[#EF4444] bg-red-50 text-[#1E293B]';
    default:
      return 'bg-white';
  }
}

function getSlotClass(slot: ViewSlot, selectedSlot: ViewSlot | null, canSelect: boolean) {
  if (slot.status === 'occupied') {
    return 'cursor-not-allowed border-[#EF4444] bg-[#EF4444]/20 text-[#EF4444]';
  }

  if (slot.status === 'reserved') {
    return 'cursor-not-allowed border-[#F59E0B] bg-[#FEF3C7] text-[#B45309]';
  }

  if (selectedSlot?.id === slot.id) {
    return 'scale-105 border-[#0284C7] bg-[#0284C7] text-white shadow-lg ring-4 ring-[#0284C7]/30';
  }

  if (!canSelect) {
    return 'cursor-default border-[#10B981] bg-[#10B981]/20 text-[#10B981]';
  }

  return 'cursor-pointer border-[#10B981] bg-[#10B981]/20 text-[#10B981] hover:bg-[#10B981]/40';
}

export default function ParkingApp() {
  const router = useRouter();
  const [zones, setZones] = useState<ParkingZone[]>(INITIAL_PARKING_ZONES);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedZone, setSelectedZone] = useState<ParkingZone | null>(null);
  const [showGPSModal, setShowGPSModal] = useState(false);
  const [showGPSMap, setShowGPSMap] = useState(false);
  const [warningInfo, setWarningInfo] = useState({ show: false, title: '', message: '' });
  const [routeStatus, setRouteStatus] = useState<RouteStatus>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [currentZoneSlots, setCurrentZoneSlots] = useState<ViewSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<ViewSlot | null>(null);
  const [systemRole, setSystemRole] = useState<SystemRole>('Không xác định');

  const canNavigate = canUseUC3Navigation(systemRole);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      router.push('/');
      return;
    }

    try {
      const parsedUser = JSON.parse(user) as StoredUser;
      setSystemRole(normalizeSystemRole(parsedUser.role));
    } catch {
      localStorage.removeItem('user');
      router.push('/');
      return;
    }

    const syncZones = () => {
      setZones(readParkingZonesFromStorage() ?? INITIAL_PARKING_ZONES);
    };

    syncZones();
    window.addEventListener('storage', syncZones);
    return () => window.removeEventListener('storage', syncZones);
  }, [router]);

  const filteredZones = zones.filter((zone) => zone.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleZoneClick = (zone: ParkingZone) => {
    setRouteStatus(null);
    setShowGPSMap(false);
    const status = getMapStatus(zone);

    if (status === 'gray') return;

    if (status === 'red') {
      setWarningInfo({
        show: true,
        title: 'Khu vực đã đầy',
        message: 'Khu vực này hiện không còn chỗ trống. Vui lòng xem chú giải hoặc chọn khu vực có màu xanh/vàng.',
      });
      return;
    }

    if (status === 'maintenance') {
      setWarningInfo({
        show: true,
        title: 'Khu vực bảo trì',
        message: 'Khu vực này đang được nâng cấp cảm biến. Vui lòng chọn khu vực khác.',
      });
      return;
    }

    setSelectedZone(zone);
    setCurrentZoneSlots(toViewSlots(zone));
    setViewMode('zoneDetail');
    setSelectedSlot(null);
  };

  const handleBackToOverview = () => {
    setViewMode('overview');
    setSelectedZone(null);
    setSelectedSlot(null);
    setRouteStatus(null);
    setShowGPSMap(false);
    setShowGPSModal(false);
  };

  const handleSlotClick = (slot: ViewSlot) => {
    if (slot.status !== 'empty') return;

    if (!canNavigate) {
      setWarningInfo({
        show: true,
        title: 'Chỉ được xem bản đồ',
        message:
          'Tài khoản hiện tại chỉ có quyền xem tình trạng bãi đỗ. Chức năng chọn ô và chỉ đường thuộc Sinh viên/Cán bộ/Giảng viên.',
      });
      return;
    }

    setSelectedSlot(slot);
    setRouteStatus(null);
    setShowGPSMap(false);
  };

  const handleStartNavigation = () => {
    if (!canNavigate) {
      setWarningInfo({
        show: true,
        title: 'Không có quyền chỉ đường',
        message: 'UC3 chỉ cho phép người dùng nội bộ chọn ô và bắt đầu chỉ đường. Tài khoản quản trị/vận hành chỉ xem tình trạng bãi đỗ.',
      });
      return;
    }

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
    setShowGPSMap(true);
  };

  const handleCloseGPSMap = () => {
    setShowGPSMap(false);
    setRouteStatus(null);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B]">
      <Header />

      <div className="flex h-[calc(100vh-80px)] gap-6 p-6">
        <div className="flex w-1/3 flex-col gap-6">
          {viewMode === 'overview' ? (
            <>
              <div className="rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-sm">
                <h2 className="mb-4 flex items-center gap-2 text-lg font-bold uppercase text-[#1E293B]">
                  <Search size={20} className="text-[#0284C7]" /> Tìm kiếm khu vực
                </h2>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Nhập tên phân khu..."
                    className="w-full rounded-xl border border-[#64748B]/40 py-3 pl-10 pr-4 focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                  <Search className="absolute left-3 top-3.5 text-[#64748B]" size={20} />
                </div>
              </div>

              <div className="rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-sm font-bold uppercase text-[#64748B]">Chú giải trạng thái</h2>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-md bg-[#10B981]"></div> Còn chỗ</div>
                  <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-md bg-[#F59E0B]"></div> Gần đầy</div>
                  <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-md bg-[#EF4444]"></div> Hết chỗ</div>
                  <div className="flex items-center gap-2"><div className="h-4 w-4 rounded-md bg-[#94A3B8]"></div> Mất tín hiệu</div>
                  <div className="col-span-2 flex items-center gap-2"><div className="h-4 w-4 rounded-md border-2 border-dashed border-[#EF4444] bg-red-50"></div> Bảo trì / Đóng cửa</div>
                </div>
              </div>
            </>
          ) : (
            <>
              <button
                onClick={handleBackToOverview}
                className="flex w-fit items-center gap-2 font-bold text-[#64748B] transition-colors hover:text-[#0284C7]"
              >
                <ArrowLeft size={20} /> Quay lại sơ đồ tổng
              </button>

              <div className="flex flex-1 flex-col rounded-2xl border border-[#0284C7] bg-white p-6 shadow-sm">
                <h2 className="mb-2 flex items-center gap-2 text-xl font-bold text-[#0284C7]">
                  <MapPin size={24} /> Bản đồ chi tiết {selectedZone?.name}
                </h2>
                <div className="mt-4 space-y-3 text-[#1E293B]">
                  <div className="flex justify-between border-b border-[#64748B]/20 pb-2">
                    <span className="text-[#64748B]">Ô trống khu vực này:</span>
                    <span className="font-bold">
                      {selectedZone ? `${getAvailableCount(selectedZone)}/${selectedZone.slots.length}` : '--'}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-[#64748B]/20 pb-2">
                    <span className="text-[#64748B]">Mức sử dụng / khóa:</span>
                    <span className="font-bold">{selectedZone ? getZoneUsageText(selectedZone) : '--'}</span>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="mb-2 font-bold text-[#1E293B]">Vị trí đã chọn:</h3>
                  {selectedSlot ? (
                    <div className="flex items-center justify-between rounded-xl border border-[#0284C7] bg-[#F0F9FF] p-4">
                      <div className="flex items-center gap-2 text-lg font-bold text-[#0284C7]">
                        <Car size={24} /> {selectedSlot.name}
                      </div>
                      <span className="rounded-full bg-[#10B981] px-2 py-1 text-xs uppercase text-white">Sẵn sàng</span>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-[#64748B]/50 bg-gray-50 p-4 text-center text-sm text-[#64748B]">
                      {canNavigate ? 'Nhấp vào vị trí trống trên bản đồ.' : 'Tài khoản hiện tại chỉ xem tình trạng bãi đỗ.'}
                    </div>
                  )}
                </div>

                <div className="mt-auto pt-6">
                  <button
                    onClick={handleStartNavigation}
                    disabled={!canNavigate || !selectedSlot || routeStatus !== null}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition-all ${
                      !canNavigate || !selectedSlot || routeStatus !== null
                        ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                        : 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
                    }`}
                  >
                    <Navigation size={20} />
                    {!canNavigate ? 'CHỈ XEM BẢN ĐỒ' : routeStatus ? 'ĐANG CHỈ ĐƯỜNG' : 'BẮT ĐẦU CHỈ ĐƯỜNG'}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative flex w-2/3 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#1E293B] shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent opacity-10"></div>

          <div className="relative flex h-full w-full flex-col p-8">
            {viewMode === 'overview' ? (
              <>
                <h2 className="absolute left-6 top-6 flex items-center gap-2 text-xl font-bold text-white opacity-80">
                  <MapIcon /> SƠ ĐỒ TỔNG THỂ
                </h2>

                <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full bg-white px-10 py-3 font-bold text-[#1E293B] shadow-2xl">
                  CỔNG CHÍNH VÀO
                </div>

                <div className="grid h-full w-full grid-cols-3 grid-rows-2 gap-4 pb-24 pt-16">
                  {filteredZones.map((zone) => {
                    const status = getMapStatus(zone);
                    return (
                      <div
                        key={zone.id}
                        onClick={() => handleZoneClick(zone)}
                        className={`relative flex flex-col items-center justify-center rounded-2xl p-4 text-center transition-transform duration-200 ${getZoneColor(zone)} ${
                          status !== 'gray' ? 'cursor-pointer hover:-translate-y-1' : ''
                        }`}
                      >
                        <div className="z-10 mb-1 text-sm font-bold leading-tight lg:text-lg">{zone.name}</div>
                        <div className="z-10 text-2xl font-black tracking-tight lg:text-4xl">{getZoneUsageText(zone)}</div>
                        {status === 'maintenance' && (
                          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[#EF4444] opacity-20">
                            <ShieldAlert size={80} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <>
                <h2 className="absolute left-6 top-6 flex items-center gap-2 text-xl font-bold text-white">
                  <MapIcon /> BẢN ĐỒ CHI TIẾT: <span className="text-[#0284C7]">{selectedZone?.name?.toUpperCase()}</span>
                </h2>

                <div className="relative mb-20 mt-16 flex w-full flex-1 justify-between gap-8 px-8">
                  <div className="absolute bottom-0 left-1/2 top-0 z-0 -translate-x-1/2 border-l-4 border-dashed border-[#64748B]/50"></div>

                  <div className="z-10 flex h-full w-[35%] flex-col gap-4">
                    {currentZoneSlots.slice(0, 6).map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className={`flex flex-1 items-center justify-center rounded-xl border-2 text-xl font-bold transition-all ${getSlotClass(slot, selectedSlot, canNavigate)}`}
                      >
                        {slot.status === 'occupied' ? <Car size={32} /> : slot.status === 'reserved' ? 'Đã bảo lưu' : slot.name}
                      </div>
                    ))}
                  </div>

                  <div className="z-10 flex h-full w-[35%] flex-col gap-4">
                    {currentZoneSlots.slice(6, 12).map((slot) => (
                      <div
                        key={slot.id}
                        onClick={() => handleSlotClick(slot)}
                        className={`flex flex-1 items-center justify-center rounded-xl border-2 text-xl font-bold transition-all ${getSlotClass(slot, selectedSlot, canNavigate)}`}
                      >
                        {slot.status === 'occupied' ? <Car size={32} /> : slot.status === 'reserved' ? 'Đã bảo lưu' : slot.name}
                      </div>
                    ))}
                  </div>

                  {routeStatus && selectedSlot && (
                    <div className="pointer-events-none absolute inset-0 z-20">
                      <svg viewBox="0 0 100 100" className="h-full w-full" preserveAspectRatio="none">
                        {(() => {
                          const index = currentZoneSlots.findIndex((slot) => slot.id === selectedSlot.id);
                          const isLeft = index < 6;
                          const row = isLeft ? index : index - 6;
                          const targetX = isLeft ? 17.5 : 82.5;
                          const targetY = row * (100 / 6) + 100 / 12;
                          const pathD = `M 12 88 L 50 88 L 50 ${targetY} L ${targetX} ${targetY}`;
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
                      <div
                        className="absolute flex animate-bounce items-center gap-1 rounded bg-[#38BDF8] px-2 py-0.5 text-[10px] font-bold text-white shadow-sm"
                        style={{
                          left: '12%',
                          bottom: '12%',
                          transform: 'translateX(-50%)',
                        }}
                      >
                        <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></div>
                        VỊ TRÍ CỦA BẠN
                      </div>
                    </div>
                  )}
                </div>

                <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 rounded-full border-t-4 border-[#0284C7] bg-white px-10 py-3 font-bold text-[#1E293B] shadow-2xl">
                  LỐI VÀO PHÂN KHU
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {warningInfo.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/50 backdrop-blur-sm">
          <div className="w-[400px] animate-in rounded-3xl bg-white p-8 text-center shadow-2xl duration-200 zoom-in-95">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
              <AlertOctagon size={32} className="text-[#EF4444]" />
            </div>
            <h3 className="mb-2 text-xl font-bold text-[#1E293B]">{warningInfo.title}</h3>
            <p className="mb-8 text-sm leading-relaxed text-[#64748B]">{warningInfo.message}</p>
            <button
              onClick={() => setWarningInfo({ show: false, title: '', message: '' })}
              className="w-full rounded-xl bg-[#1E293B] py-3.5 font-bold text-white transition-colors hover:bg-[#0f172a]"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      )}

      {showGPSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/50 backdrop-blur-sm">
          <div className="w-[400px] overflow-hidden rounded-2xl bg-white p-6 text-center shadow-2xl">
            <h3 className="mb-4 text-lg font-bold">Yêu cầu truy cập vị trí</h3>
            <p className="mb-6 text-sm leading-relaxed text-[#64748B]">
              Hệ thống cần quyền GPS để dẫn đường từ vị trí hiện tại. Nếu từ chối, hệ thống sẽ dùng tuyến mô phỏng mặc định từ cổng vào.
            </p>
            <div className="flex gap-4">
              <button onClick={handleGPSDeny} className="flex-1 rounded-xl bg-gray-100 py-3 font-bold transition-colors hover:bg-gray-200">Từ chối</button>
              <button onClick={handleGPSAllow} className="flex-1 rounded-xl bg-[#0284C7] py-3 font-bold text-white transition-colors hover:bg-[#0369A1]">Cho phép</button>
            </div>
          </div>
        </div>
      )}

      {showGPSMap && (
        <div className="fixed inset-0 z-50">
          <GPSMap
            selectedZoneId={selectedZone?.id || null}
            selectedSlotName={selectedSlot?.name || null}
            isNavigating={routeStatus !== null}
            routeMode={routeStatus ?? 'gps'}
            onClose={handleCloseGPSMap}
          />
        </div>
      )}
    </div>
  );
}

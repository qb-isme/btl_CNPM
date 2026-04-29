"use client"

import { useEffect, useState, useRef } from 'react'
import { Navigation, MapPin, Car, Clock, Route, X, Locate, AlertCircle } from 'lucide-react'

interface GPSMapProps {
  selectedZoneId: string | null
  selectedSlotName: string | null
  isNavigating: boolean
  onClose: () => void
}

// Giả lập các slot trong khu vực (giống như trong page.tsx)
const generateSlots = (zoneId: string) => {
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `${zoneId}-${i + 1}`,
    name: `Vi tri ${i + 1}`,
    isOccupied: i % 3 === 0 
  }));
};

// Thông tin các khu vực
const zoneInfo: Record<string, { name: string; gpsCenter: { lat: number; lng: number } }> = {
  'A': { name: 'Khu A (Gan cong)', gpsCenter: { lat: 10.8805, lng: 106.8050 } },
  'B': { name: 'Khu B (Trung tam)', gpsCenter: { lat: 10.8810, lng: 106.8060 } },
  'C': { name: 'Khu C (Can tin)', gpsCenter: { lat: 10.8795, lng: 106.8065 } },
  'D': { name: 'Khu D (Khuat)', gpsCenter: { lat: 10.8815, lng: 106.8045 } },
  'E': { name: 'Khu E (Can bo GV)', gpsCenter: { lat: 10.8790, lng: 106.8055 } },
  'F': { name: 'Khu F (Mo rong)', gpsCenter: { lat: 10.8808, lng: 106.8070 } },
};

export default function GPSMap({ selectedZoneId, selectedSlotName, isNavigating, onClose }: GPSMapProps) {
  const [userPosition, setUserPosition] = useState<{ x: number; y: number } | null>(null)
  const [accuracy, setAccuracy] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(true)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number } | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const zone = selectedZoneId ? zoneInfo[selectedZoneId] : null
  const slots = selectedZoneId ? generateSlots(selectedZoneId) : []
  
  // Tìm slot đã chọn
  const selectedSlotIndex = slots.findIndex(s => s.name === selectedSlotName)
  const isLeftColumn = selectedSlotIndex < 6
  const rowIndex = isLeftColumn ? selectedSlotIndex : selectedSlotIndex - 6

  // Chuyển đổi GPS thành vị trí trên sơ đồ 2D
  const gpsToFloorPosition = (lat: number, lng: number): { x: number; y: number } => {
    if (!zone) return { x: 50, y: 95 }
    
    // Tính khoảng cách từ tâm khu vực (theo mét)
    const deltaLat = (lat - zone.gpsCenter.lat) * 111320
    const deltaLng = (lng - zone.gpsCenter.lng) * 111320 * Math.cos(zone.gpsCenter.lat * Math.PI / 180)
    
    // Chuyển sang vị trí trên sơ đồ (giả sử khu vực 50m x 50m)
    // X: 0-100, trung tâm là 50
    // Y: 0-100, cổng vào ở dưới (95)
    const x = 50 + (deltaLng / 25) * 50 // 25m mỗi bên
    const y = 80 - (deltaLat / 40) * 70 // 40m từ cổng đến cuối khu
    
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(10, Math.min(95, y))
    }
  }

  // Lấy vị trí GPS
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Trinh duyet khong ho tro GPS')
      // Fallback - giả lập vị trí tại cổng vào
      setUserPosition({ x: 50, y: 92 })
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setGpsCoords(coords)
        setUserPosition(gpsToFloorPosition(coords.lat, coords.lng))
        setAccuracy(pos.coords.accuracy)
        setIsLoading(false)
      },
      (err) => {
        setGpsError(err.message)
        // Fallback - giả lập vị trí tại cổng vào
        setUserPosition({ x: 50, y: 92 })
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [zone])

  // Theo dõi GPS real-time
  useEffect(() => {
    if (!isTracking || !navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setGpsCoords(coords)
        setUserPosition(gpsToFloorPosition(coords.lat, coords.lng))
        setAccuracy(pos.coords.accuracy)
        setGpsError(null)
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [isTracking, zone])

  // Tính khoảng cách và thời gian
  useEffect(() => {
    if (!userPosition || selectedSlotIndex < 0 || !isNavigating) {
      setRouteInfo(null)
      return
    }

    // Tính toán vị trí đích trên sơ đồ
    const targetX = isLeftColumn ? 20 : 80
    const targetY = 15 + (rowIndex * 12)
    
    // Ước tính khoảng cách (giả sử mỗi đơn vị = 0.5m)
    const dx = (targetX - userPosition.x) * 0.5
    const dy = (targetY - userPosition.y) * 0.5
    const distanceMeters = Math.sqrt(dx * dx + dy * dy)
    
    const distanceDisplay = `${Math.round(distanceMeters)} m`
    const durationSeconds = distanceMeters / 1.2 // Tốc độ đi bộ 1.2m/s
    const durationMinutes = Math.max(1, Math.ceil(durationSeconds / 60))
    
    setRouteInfo({
      distance: distanceDisplay,
      duration: `${durationMinutes} phut`
    })
  }, [userPosition, selectedSlotIndex, isLeftColumn, rowIndex, isNavigating])

  // Tạo đường đi SVG
  const generateRoutePath = () => {
    if (!userPosition || selectedSlotIndex < 0) return ''
    
    const startX = userPosition.x
    const startY = userPosition.y
    const targetX = isLeftColumn ? 20 : 80
    const targetY = 15 + (rowIndex * 12)
    
    // Đường đi: từ vị trí hiện tại -> giữa đường -> đến ô đỗ
    return `M ${startX} ${startY} L 50 ${startY} L 50 ${targetY} L ${targetX} ${targetY}`
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#1E293B]">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#0284C7] border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Dang xac dinh vi tri GPS...</p>
          <p className="text-sm text-slate-400 mt-2">Vui long cho phep truy cap vi tri</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#64748B]/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Navigation className="text-[#0284C7]" size={28} />
            <div>
              <h2 className="font-bold text-[#1E293B] text-xl">So do 2D - {zone?.name}</h2>
              <p className="text-sm text-[#64748B]">Tich hop dinh vi GPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={28} className="text-[#64748B]" />
          </button>
        </div>

        {/* Destination info */}
        {isNavigating && selectedSlotName && (
          <div className="px-6 pb-4 border-t border-slate-100">
            <div className="flex items-center gap-6 mt-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-[#64748B]">
                  <MapPin size={16} className="text-[#10B981]" />
                  <span>Diem den:</span>
                </div>
                <p className="font-bold text-[#1E293B] text-lg">{selectedSlotName}</p>
              </div>
              {routeInfo && (
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-[#64748B]">
                      <Route size={14} />
                      <span className="text-xs">Khoang cach</span>
                    </div>
                    <p className="font-bold text-[#0284C7] text-lg">{routeInfo.distance}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-[#64748B]">
                      <Clock size={14} />
                      <span className="text-xs">Thoi gian</span>
                    </div>
                    <p className="font-bold text-[#10B981] text-lg">{routeInfo.duration}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main 2D Floor Plan */}
      <div className="flex-1 p-6">
        <div className="w-full h-full bg-[#1E293B] rounded-2xl relative overflow-hidden border-4 border-white shadow-lg">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-10">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="floor-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#64748b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#floor-grid)" />
            </svg>
          </div>

          {/* Center Road */}
          <div className="absolute left-1/2 top-0 bottom-0 w-16 -translate-x-1/2 bg-[#64748B]/30"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-1 -translate-x-1/2 border-l-2 border-dashed border-[#F59E0B]/50"></div>

          {/* Parking Slots - Left Column */}
          <div className="absolute left-[5%] top-[10%] w-[30%] h-[75%] flex flex-col gap-2">
            {slots.slice(0, 6).map((slot, index) => {
              const isSelected = slot.name === selectedSlotName
              return (
                <div 
                  key={slot.id}
                  className={`flex-1 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-all
                    ${slot.isOccupied 
                      ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]' 
                      : isSelected
                        ? 'bg-[#10B981] border-[#10B981] text-white ring-4 ring-[#10B981]/30 shadow-lg'
                        : 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'}
                  `}
                >
                  {slot.isOccupied ? <Car size={28} /> : slot.name}
                  {isSelected && (
                    <div className="absolute">
                      <div className="animate-ping absolute inset-0 rounded-xl bg-[#10B981]/30"></div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Parking Slots - Right Column */}
          <div className="absolute right-[5%] top-[10%] w-[30%] h-[75%] flex flex-col gap-2">
            {slots.slice(6, 12).map((slot) => {
              const isSelected = slot.name === selectedSlotName
              return (
                <div 
                  key={slot.id}
                  className={`flex-1 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-all
                    ${slot.isOccupied 
                      ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]' 
                      : isSelected
                        ? 'bg-[#10B981] border-[#10B981] text-white ring-4 ring-[#10B981]/30 shadow-lg'
                        : 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'}
                  `}
                >
                  {slot.isOccupied ? <Car size={28} /> : slot.name}
                </div>
              )
            })}
          </div>

          {/* Navigation Route */}
          {isNavigating && userPosition && selectedSlotIndex >= 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="route-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <path
                d={generateRoutePath()}
                fill="none"
                stroke="url(#route-gradient)"
                strokeWidth="1"
                strokeDasharray="4,2"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className="animate-dash"
              />
              {/* Destination marker */}
              <circle 
                cx={isLeftColumn ? 20 : 80} 
                cy={15 + (rowIndex * 12)} 
                r="1.5" 
                fill="#10B981" 
                className="animate-pulse"
              />
            </svg>
          )}

          {/* User Position Marker */}
          {userPosition && (
            <div
              className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${userPosition.x}%`, top: `${userPosition.y}%` }}
            >
              {/* Accuracy circle */}
              <div
                className="absolute rounded-full bg-[#38BDF8]/20 border border-[#38BDF8]/30 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: `${Math.min(accuracy / 3, 50)}px`,
                  height: `${Math.min(accuracy / 3, 50)}px`,
                  left: '50%',
                  top: '50%'
                }}
              ></div>
              {/* User dot */}
              <div className="relative">
                <div className="w-5 h-5 bg-[#38BDF8] rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-[#38BDF8] rounded-full animate-ping"></div>
              </div>
              {/* Label */}
              <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-[#38BDF8] text-white text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap shadow">
                VI TRI CUA BAN
              </div>
            </div>
          )}

          {/* GPS Warning */}
          {gpsError && (
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-[#F59E0B]/90 text-[#1E293B] px-4 py-2 rounded-lg flex items-center gap-2 z-20">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">GPS: {gpsError}</span>
            </div>
          )}

          {/* Zone Gate */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-[#1E293B] px-8 py-2 rounded-full font-bold shadow-lg text-sm z-10 border-t-4 border-[#0284C7]">
            CONG VAO PHAN KHU
          </div>

          {/* Zone Label */}
          <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
            <span className="font-bold text-[#1E293B]">{zone?.name}</span>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-white border-t border-[#64748B]/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-[#10B981] animate-pulse' : 'bg-[#94A3B8]'}`}></div>
            <div>
              <p className="text-sm font-medium text-[#1E293B]">
                {isTracking ? 'Dang theo doi GPS' : 'GPS da tam dung'}
              </p>
              <p className="text-xs text-[#64748B]">
                {gpsCoords 
                  ? `Toa do: ${gpsCoords.lat.toFixed(5)}, ${gpsCoords.lng.toFixed(5)}`
                  : 'Dang xac dinh...'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsTracking(!isTracking)}
            className={`p-3 rounded-xl transition-colors ${
              isTracking ? 'bg-[#0284C7] text-white' : 'bg-slate-200 text-[#64748B] hover:bg-slate-300'
            }`}
          >
            <Locate size={20} />
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-[#64748B]/20 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#38BDF8] border-2 border-white shadow"></div>
            <span className="text-[#64748B]">Vi tri cua ban</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-[#10B981]"></div>
            <span className="text-[#64748B]">Diem den</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-[#EF4444]/30 border border-[#EF4444]"></div>
            <span className="text-[#64748B]">Da co xe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-[#10B981]/30 border border-[#10B981]"></div>
            <span className="text-[#64748B]">Trong</span>
          </div>
        </div>
      </div>

      {/* CSS for dash animation */}
      <style jsx>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -24;
          }
        }
        .animate-dash {
          animation: dash 1s linear infinite;
        }
      `}</style>
    </div>
  )
}

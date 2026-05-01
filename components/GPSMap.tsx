"use client"

import { useState, useEffect } from 'react'
import { Navigation, MapPin, Car, Clock, Route, X, ArrowUp, CornerDownLeft, CornerDownRight, CheckCircle2, CircleDot, Play, LocateFixed } from 'lucide-react'

interface GPSMapProps {
  selectedZoneId: string | null
  selectedSlotName: string | null
  isNavigating: boolean
  onClose: () => void
}

// Giả lập các slot trong khu vực
const generateSlots = (zoneId: string) => {
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `${zoneId}-${i + 1}`,
    name: `Vị trí ${i + 1}`,
    isOccupied: i % 3 === 0 
  }));
};

// Thông tin các khu vực
const zoneInfo: Record<string, { name: string }> = {
  'A': { name: 'Khu A (Gần cổng)' },
  'B': { name: 'Khu B (Trung tâm)' },
  'C': { name: 'Khu C (Căn tin)' },
  'D': { name: 'Khu D (Khuất)' },
  'E': { name: 'Khu E (Cán bộ GV)' },
  'F': { name: 'Khu F (Mở rộng)' },
};

export default function GPSMap({ selectedZoneId, selectedSlotName, isNavigating, onClose }: GPSMapProps) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  
  // Tọa độ cổng vào cố định ở chính giữa
  const ENTRANCE_X = 50
  const ENTRANCE_Y = 95
  
  const [userPosition, setUserPosition] = useState<{ x: number; y: number }>({ x: ENTRANCE_X, y: ENTRANCE_Y }) 
  const [gpsStatus, setGpsStatus] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [hasRealGPS, setHasRealGPS] = useState(false)

  const zone = selectedZoneId ? zoneInfo[selectedZoneId] : null
  const slots = selectedZoneId ? generateSlots(selectedZoneId) : []
  
  // Tìm slot đã chọn
  const selectedSlotIndex = slots.findIndex(s => s.name === selectedSlotName)
  const isLeftColumn = selectedSlotIndex >= 0 && selectedSlotIndex < 6
  const rowIndex = isLeftColumn ? selectedSlotIndex : selectedSlotIndex - 6

  // Vị trí đích đến trên sơ đồ (% của container) cho layout đối xứng mới
  const targetX = isLeftColumn ? 22.5 : 77.5 // Cột trái 22.5%, Cột phải 77.5%
  const targetY = selectedSlotIndex >= 0 ? 21.25 + (rowIndex * 12.5) : 50 // Căn dọc theo các ô đỗ

  // Xin quyền GPS
  useEffect(() => {
    if (isNavigating && gpsStatus === 'pending') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setGpsStatus('granted')
            setHasRealGPS(true)
            setUserPosition({ x: ENTRANCE_X - 1 + Math.random() * 2, y: ENTRANCE_Y - 2 + Math.random() * 2 })
          },
          () => {
            setGpsStatus('denied')
            setHasRealGPS(false)
            setUserPosition({ x: ENTRANCE_X, y: ENTRANCE_Y })
          }
        )
      } else {
        setGpsStatus('denied')
        setUserPosition({ x: ENTRANCE_X, y: ENTRANCE_Y })
      }
    }
  }, [isNavigating, gpsStatus])

  // Các bước chỉ dẫn cố định
  const getNavigationSteps = () => {
    if (selectedSlotIndex < 0) return []
    
    const slotNumber = selectedSlotIndex + 1
    const rowNumber = slotNumber <= 6 ? slotNumber : slotNumber - 6
    
    return [
      {
        icon: ArrowUp,
        text: 'Đi thẳng vào bãi đỗ',
        detail: 'Từ cổng vào đi thẳng lên',
        position: { x: ENTRANCE_X, y: (ENTRANCE_Y + targetY) / 2 }
      },
      {
        icon: isLeftColumn ? CornerDownLeft : CornerDownRight,
        text: `Rẽ ${isLeftColumn ? 'trái' : 'phải'} vào ô đỗ`,
        detail: `Hàng đỗ xe thứ ${rowNumber}`,
        position: { x: ENTRANCE_X, y: targetY }
      },
      {
        icon: CheckCircle2,
        text: 'Đỗ xe tại vị trí',
        detail: `${selectedSlotName} - Ô màu xanh lá`,
        position: { x: targetX, y: targetY }
      }
    ]
  }

  const navigationSteps = getNavigationSteps()

  // Mô phỏng di chuyển
  const startSimulation = () => {
    setIsSimulating(true)
    setCurrentStepIndex(-1)
    setUserPosition(hasRealGPS ? { x: ENTRANCE_X - 1 + Math.random() * 2, y: ENTRANCE_Y - 2 } : { x: ENTRANCE_X, y: ENTRANCE_Y })

    navigationSteps.forEach((step, index) => {
      setTimeout(() => {
        setCurrentStepIndex(index)
        setUserPosition(step.position)
        
        if (index === navigationSteps.length - 1) {
          setTimeout(() => {
            setIsSimulating(false)
          }, 1500)
        }
      }, (index + 1) * 2000)
    })
  }

  const routeInfo = {
    distance: `${Math.round(15 + Math.abs(ENTRANCE_X - targetX) * 0.4 + (ENTRANCE_Y - targetY) * 0.4)} m`,
    duration: '1-2 phút'
  }

  return (
    <div className="w-full h-full bg-[#F8FAFC] flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-[#64748B]/20">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Navigation className="text-[#0284C7]" size={28} />
            <div>
              <h2 className="font-bold text-[#1E293B] text-xl">Sơ đồ 2D - {zone?.name}</h2>
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <LocateFixed size={14} className={hasRealGPS ? 'text-[#10B981]' : 'text-[#F59E0B]'} />
                <span>{hasRealGPS ? 'GPS đã kết nối' : 'Mô phỏng từ cổng vào'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
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
                  <span>Điểm đến:</span>
                </div>
                <p className="font-bold text-[#1E293B] text-lg">{selectedSlotName}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="flex items-center gap-1 text-[#64748B]">
                    <Route size={14} />
                    <span className="text-xs">Khoảng cách</span>
                  </div>
                  <p className="font-bold text-[#0284C7] text-lg">{routeInfo.distance}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center gap-1 text-[#64748B]">
                    <Clock size={14} />
                    <span className="text-xs">Thời gian</span>
                  </div>
                  <p className="font-bold text-[#10B981] text-lg">{routeInfo.duration}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main 2D Floor Plan - CENTERED LAYOUT */}
      <div className="flex-1 p-4 min-h-0">
        <div className="w-full h-full bg-[#A3D9A5] rounded-xl relative overflow-hidden border border-slate-300 shadow-md">
          
          {/* Title Overlay */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 text-center w-full">
            <h3 className="font-black text-slate-800 tracking-wider text-sm md:text-base drop-shadow-sm">
              SƠ ĐỒ BÃI ĐỖ XE - KHU {selectedZoneId}
            </h3>
          </div>

          {/* --- KHU VỰC ĐƯỜNG ĐI TRUNG TÂM (MÀU XÁM) --- */}
          <div className="absolute top-[8%] left-[35%] w-[30%] h-[92%] bg-[#8E9399] rounded-t-xl"></div>
          
          {/* Vạch kẻ đường giữa */}
          <div className="absolute top-[10%] left-[50%] -translate-x-1/2 w-[2px] h-[85%] border-l-2 border-dashed border-[#FCD34D]/70"></div>

          {/* --- CÁC Ô ĐỖ XE --- */}
          {/* Cột Trái (0-5) */}
          <div className="absolute top-[15%] left-[10%] w-[25%] h-[75%] flex flex-col gap-2">
            {slots.slice(0, 6).map((slot, i) => {
              const isSelected = slot.name === selectedSlotName
              return (
                <div key={slot.id} className={`flex-1 w-full border-[1.5px] flex items-center justify-center transition-all relative
                  ${slot.isOccupied 
                    ? 'bg-slate-200 border-slate-400 text-slate-500' 
                    : isSelected
                      ? 'bg-[#10B981] border-[#10B981] text-white ring-2 ring-[#10B981]/40 shadow-lg z-10'
                      : 'bg-white border-slate-600 text-slate-800 hover:bg-slate-50'}
                `}>
                  {slot.isOccupied ? <Car size={20} /> : <span className="font-bold text-[10px] md:text-xs whitespace-nowrap">{selectedZoneId}-{String(i+1).padStart(2, '0')}</span>}
                  {isSelected && <div className="absolute inset-0 animate-ping bg-[#10B981]/30"></div>}
                </div>
              )
            })}
          </div>

          {/* Cột Phải (6-11) */}
          <div className="absolute top-[15%] right-[10%] w-[25%] h-[75%] flex flex-col gap-2">
            {slots.slice(6, 12).map((slot, i) => {
              const isSelected = slot.name === selectedSlotName
              return (
                <div key={slot.id} className={`flex-1 w-full border-[1.5px] flex items-center justify-center transition-all relative
                  ${slot.isOccupied 
                    ? 'bg-slate-200 border-slate-400 text-slate-500' 
                    : isSelected
                      ? 'bg-[#10B981] border-[#10B981] text-white ring-2 ring-[#10B981]/40 shadow-lg z-10'
                      : 'bg-white border-slate-600 text-slate-800 hover:bg-slate-50'}
                `}>
                  {slot.isOccupied ? <Car size={20} /> : <span className="font-bold text-[10px] md:text-xs whitespace-nowrap">{selectedZoneId}-{String(i+7).padStart(2, '0')}</span>}
                  {isSelected && <div className="absolute inset-0 animate-ping bg-[#10B981]/30"></div>}
                </div>
              )
            })}
          </div>

          {/* Nhãn Hàng */}
          <div className="absolute top-[11%] left-[22.5%] -translate-x-1/2 text-slate-800 font-bold text-[10px] md:text-xs bg-white/70 px-2 py-0.5 rounded">
            HÀNG TRÁI
          </div>
          <div className="absolute top-[11%] right-[22.5%] translate-x-1/2 text-slate-800 font-bold text-[10px] md:text-xs bg-white/70 px-2 py-0.5 rounded">
            HÀNG PHẢI
          </div>

          {/* --- ĐƯỜNG ĐI CHẤM XANH BẰNG SVG --- */}
          {isNavigating && selectedSlotIndex >= 0 && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
              <path
                d={`M ${ENTRANCE_X}% ${ENTRANCE_Y}% L ${ENTRANCE_X}% ${targetY}% L ${targetX}% ${targetY}%`}
                fill="none"
                stroke="#0284C7"
                strokeWidth="4"
                strokeDasharray="8, 6"
                className="drop-shadow-sm"
              />
              {/* Chấm tròn ở cổng */}
              <circle cx={`${ENTRANCE_X}%`} cy={`${ENTRANCE_Y}%`} r="4" fill="#0284C7" />
              {/* Chấm tròn nhấp nháy ở đích */}
              <circle cx={`${targetX}%`} cy={`${targetY}%`} r="6" fill="#10B981" stroke="white" strokeWidth="2" className="animate-pulse" />
            </svg>
          )}

          {/* User Position Marker */}
          {isNavigating && (
            <div
              className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-linear"
              style={{ left: `${userPosition.x}%`, top: `${userPosition.y}%` }}
            >
              <div className="relative">
                <div className="w-6 h-6 bg-[#0284C7] rounded-full border-2 border-white shadow-md flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
                <div className="absolute inset-0 w-6 h-6 bg-[#0284C7] rounded-full animate-ping opacity-40"></div>
              </div>
              <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-white text-[#0284C7] text-[9px] font-bold px-1.5 py-0.5 rounded border border-[#0284C7] whitespace-nowrap shadow">
                BẠN
              </div>
            </div>
          )}

          {/* Nhãn cổng vào */}
          <div className="absolute bottom-2 left-[50%] -translate-x-1/2 bg-white/95 text-slate-800 px-4 py-1.5 rounded text-[11px] font-bold shadow-md border-b-2 border-[#0284C7] z-10">
            CỔNG VÀO
          </div>
        </div>
      </div>

      {/* Navigation Instructions Panel */}
      {isNavigating && navigationSteps.length > 0 && (
        <div className="bg-white border-t border-[#64748B]/20 px-6 py-4 max-h-[30%] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Route size={18} className="text-[#0284C7]" />
              <h3 className="font-bold text-[#1E293B]">Hướng dẫn đi vào ô đỗ xe</h3>
            </div>
            <button
              onClick={startSimulation}
              disabled={isSimulating}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all ${
                isSimulating 
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                  : 'bg-[#0284C7] text-white hover:bg-[#0369A1]'
              }`}
            >
              <Play size={16} />
              {isSimulating ? 'Đang mô phỏng...' : 'Xem mô phỏng'}
            </button>
          </div>
          
          <div className="space-y-2">
            {navigationSteps.map((step, index) => {
              const StepIcon = step.icon
              const isCompleted = currentStepIndex > index
              const isActive = currentStepIndex === index
              return (
                <div 
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isCompleted 
                      ? 'bg-[#10B981]/10 border border-[#10B981]/30' 
                      : isActive
                        ? 'bg-[#0284C7]/10 border-2 border-[#0284C7] shadow-sm'
                        : 'bg-slate-50 border border-slate-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isCompleted 
                      ? 'bg-[#10B981] text-white' 
                      : isActive
                        ? 'bg-[#0284C7] text-white animate-pulse'
                        : 'bg-slate-200 text-[#64748B]'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : <StepIcon size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${isCompleted ? 'text-[#10B981]' : isActive ? 'text-[#0284C7]' : 'text-[#64748B]'}`}>
                      {step.text}
                    </p>
                    <p className={`text-sm ${isCompleted || isActive ? 'text-[#64748B]' : 'text-slate-400'}`}>
                      {step.detail}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted ? 'bg-[#10B981] text-white' : isActive ? 'bg-[#0284C7] text-white' : 'bg-slate-200 text-[#64748B]'
                  }`}>
                    {index + 1}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white px-6 py-3 border-t border-[#64748B]/20">
        <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-white border border-slate-500"></div>
            <span className="text-[#64748B]">Trống</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-slate-300 border border-slate-400"></div>
            <span className="text-[#64748B]">Đã đỗ</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#10B981] border border-[#10B981]"></div>
            <span className="text-[#64748B]">Đang chọn</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 border-t-2 border-dashed border-[#0284C7]"></div>
            <span className="text-[#64748B]">Đường đi</span>
          </div>
        </div>
      </div>
    </div>
  )
}
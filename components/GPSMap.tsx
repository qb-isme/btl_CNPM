"use client"

import { useState, useEffect } from 'react'
import { Navigation, MapPin, Car, Clock, Route, X, ArrowUp, CornerDownLeft, CornerDownRight, CheckCircle2, CircleDot, Play, LocateFixed } from 'lucide-react'

interface GPSMapProps {
  selectedZoneId: string | null
  selectedSlotName: string | null
  isNavigating: boolean
  onClose: () => void
}

// Gia lap cac slot trong khu vuc
const generateSlots = (zoneId: string) => {
  return Array.from({ length: 12 }).map((_, i) => ({
    id: `${zoneId}-${i + 1}`,
    name: `Vi tri ${i + 1}`,
    isOccupied: i % 3 === 0 
  }));
};

// Thong tin cac khu vuc
const zoneInfo: Record<string, { name: string }> = {
  'A': { name: 'Khu A (Gan cong)' },
  'B': { name: 'Khu B (Trung tam)' },
  'C': { name: 'Khu C (Can tin)' },
  'D': { name: 'Khu D (Khuat)' },
  'E': { name: 'Khu E (Can bo GV)' },
  'F': { name: 'Khu F (Mo rong)' },
};

export default function GPSMap({ selectedZoneId, selectedSlotName, isNavigating, onClose }: GPSMapProps) {
  const [isSimulating, setIsSimulating] = useState(false)
  const [currentStepIndex, setCurrentStepIndex] = useState(-1)
  const [userPosition, setUserPosition] = useState<{ x: number; y: number }>({ x: 50, y: 92 }) // Mac dinh: cong vao
  const [gpsStatus, setGpsStatus] = useState<'pending' | 'granted' | 'denied'>('pending')
  const [hasRealGPS, setHasRealGPS] = useState(false)

  const zone = selectedZoneId ? zoneInfo[selectedZoneId] : null
  const slots = selectedZoneId ? generateSlots(selectedZoneId) : []
  
  // Tim slot da chon
  const selectedSlotIndex = slots.findIndex(s => s.name === selectedSlotName)
  const isLeftColumn = selectedSlotIndex >= 0 && selectedSlotIndex < 6
  const rowIndex = isLeftColumn ? selectedSlotIndex : selectedSlotIndex - 6

  // Vi tri dich den tren so do (% cua container)
  const targetX = isLeftColumn ? 20 : 80
  const targetY = selectedSlotIndex >= 0 ? 12 + (rowIndex * 13) : 50

  // Xin quyen GPS
  useEffect(() => {
    if (isNavigating && gpsStatus === 'pending') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          () => {
            setGpsStatus('granted')
            setHasRealGPS(true)
            // Mo phong: dat vi tri gan cong vao nhung khong phai chinh xac o cong
            setUserPosition({ x: 48 + Math.random() * 4, y: 88 + Math.random() * 4 })
          },
          () => {
            setGpsStatus('denied')
            setHasRealGPS(false)
            // Mac dinh: vi tri tai cong vao
            setUserPosition({ x: 50, y: 92 })
          }
        )
      } else {
        setGpsStatus('denied')
        setUserPosition({ x: 50, y: 92 })
      }
    }
  }, [isNavigating, gpsStatus])

  // Cac buoc chi dan co dinh
  const getNavigationSteps = () => {
    if (selectedSlotIndex < 0) return []
    
    const slotNumber = selectedSlotIndex + 1
    const rowNumber = slotNumber <= 6 ? slotNumber : slotNumber - 6
    
    return [
      {
        icon: ArrowUp,
        text: 'Di thang vao khu vuc',
        detail: 'Di thang khoang 15m tu cong vao',
        position: { x: 50, y: 60 }
      },
      {
        icon: isLeftColumn ? CornerDownLeft : CornerDownRight,
        text: isLeftColumn ? 'Re trai vao hang do xe' : 'Re phai vao hang do xe',
        detail: isLeftColumn ? 'Hang o do xe ben trai' : 'Hang o do xe ben phai',
        position: { x: isLeftColumn ? 35 : 65, y: targetY + 15 }
      },
      {
        icon: CircleDot,
        text: `Tim ${selectedSlotName}`,
        detail: `O do xe thu ${rowNumber} trong hang`,
        position: { x: targetX, y: targetY + 5 }
      },
      {
        icon: CheckCircle2,
        text: 'Do xe tai vi tri',
        detail: `${selectedSlotName} - O mau xanh la`,
        position: { x: targetX, y: targetY }
      }
    ]
  }

  const navigationSteps = getNavigationSteps()

  // Mo phong di chuyen
  const startSimulation = () => {
    setIsSimulating(true)
    setCurrentStepIndex(-1)
    // Reset ve vi tri ban dau (cong vao hoac vi tri GPS)
    setUserPosition(hasRealGPS ? { x: 48 + Math.random() * 4, y: 88 + Math.random() * 4 } : { x: 50, y: 92 })

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

  // Tao duong di SVG - duong cham cham tu vi tri hien tai den dich
  const generateRoutePath = () => {
    if (selectedSlotIndex < 0) return ''
    
    const startX = userPosition.x
    const startY = userPosition.y
    const midY = 60 // Diem giua truoc khi re
    const turnX = isLeftColumn ? 35 : 65 // Diem re
    
    // Duong di: Tu vi tri hien tai -> di thang -> re trai/phai -> den o do xe
    return `M ${startX} ${startY} L ${startX} ${midY} L ${turnX} ${midY} L ${turnX} ${targetY + 5} L ${targetX} ${targetY + 5} L ${targetX} ${targetY}`
  }

  // Tinh khoang cach va thoi gian uoc tinh
  const routeInfo = {
    distance: `${Math.round(15 + Math.abs(50 - targetX) * 0.3 + (92 - targetY) * 0.3)} m`,
    duration: '1-2 phut'
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
              <div className="flex items-center gap-2 text-sm text-[#64748B]">
                <LocateFixed size={14} className={hasRealGPS ? 'text-[#10B981]' : 'text-[#F59E0B]'} />
                <span>{hasRealGPS ? 'GPS da ket noi' : 'Mo phong tu cong vao'}</span>
              </div>
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
            </div>
          </div>
        )}
      </div>

      {/* Main 2D Floor Plan */}
      <div className="flex-1 p-4 min-h-0">
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
            {slots.slice(0, 6).map((slot) => {
              const isSelected = slot.name === selectedSlotName
              return (
                <div 
                  key={slot.id}
                  className={`flex-1 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-all relative
                    ${slot.isOccupied 
                      ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]' 
                      : isSelected
                        ? 'bg-[#10B981] border-[#10B981] text-white ring-4 ring-[#10B981]/30 shadow-lg'
                        : 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'}
                  `}
                >
                  {slot.isOccupied ? <Car size={28} /> : slot.name}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-xl animate-ping bg-[#10B981]/20"></div>
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
                  className={`flex-1 rounded-xl border-2 flex items-center justify-center font-bold text-lg transition-all relative
                    ${slot.isOccupied 
                      ? 'bg-[#EF4444]/20 border-[#EF4444] text-[#EF4444]' 
                      : isSelected
                        ? 'bg-[#10B981] border-[#10B981] text-white ring-4 ring-[#10B981]/30 shadow-lg'
                        : 'bg-[#10B981]/20 border-[#10B981] text-[#10B981]'}
                  `}
                >
                  {slot.isOccupied ? <Car size={28} /> : slot.name}
                  {isSelected && (
                    <div className="absolute inset-0 rounded-xl animate-ping bg-[#10B981]/20"></div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Navigation Route - Duong cham cham */}
          {isNavigating && selectedSlotIndex >= 0 && (() => {
            const startY = 88 // Vi tri cong vao (%)
            const midY = 50 // Diem re giua (%)
            const slotTopY = 15 + (rowIndex * 12) // Vi tri o do xe (%)
            const turnXPercent = isLeftColumn ? '20%' : '80%'
            
            return (
              <>
                {/* Duong 1: Tu cong vao di len giua - DUONG DOC */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 z-20"
                  style={{
                    top: `${midY}%`,
                    height: `${startY - midY}%`,
                    width: '4px',
                    background: 'repeating-linear-gradient(to bottom, #38BDF8 0px, #38BDF8 8px, transparent 8px, transparent 14px)'
                  }}
                />
                
                {/* Duong 2: Re ngang sang trai/phai - DUONG NGANG */}
                <div 
                  className="absolute z-20"
                  style={{
                    top: `${midY}%`,
                    left: isLeftColumn ? turnXPercent : '50%',
                    width: '30%',
                    height: '4px',
                    background: 'repeating-linear-gradient(to right, #38BDF8 0px, #38BDF8 8px, transparent 8px, transparent 14px)'
                  }}
                />
                
                {/* Duong 3: Tu diem re di len o do xe - DUONG DOC */}
                <div 
                  className="absolute z-20"
                  style={{
                    top: `${slotTopY + 5}%`,
                    left: turnXPercent,
                    transform: 'translateX(-50%)',
                    height: `${midY - slotTopY - 5}%`,
                    width: '4px',
                    background: 'repeating-linear-gradient(to bottom, #38BDF8 0px, #38BDF8 8px, transparent 8px, transparent 14px)'
                  }}
                />
                
                {/* Diem bat dau - Cong vao */}
                <div 
                  className="absolute left-1/2 -translate-x-1/2 w-5 h-5 bg-[#38BDF8] rounded-full border-2 border-white shadow-lg z-25"
                  style={{ top: `${startY}%`, transform: 'translate(-50%, -50%)' }}
                />
                
                {/* Diem re 1 - O giua duong */}
                <div 
                  className="absolute left-1/2 w-4 h-4 bg-[#F59E0B] rounded-full border-2 border-white shadow z-25"
                  style={{ top: `${midY}%`, transform: 'translate(-50%, -50%)' }}
                />
                
                {/* Diem re 2 - Truoc khi vao hang */}
                <div 
                  className="absolute w-4 h-4 bg-[#F59E0B] rounded-full border-2 border-white shadow z-25"
                  style={{ top: `${midY}%`, left: turnXPercent, transform: 'translate(-50%, -50%)' }}
                />
                
                {/* Diem dich - O do xe */}
                <div 
                  className="absolute w-6 h-6 bg-[#10B981] rounded-full border-2 border-white shadow-lg z-25 animate-pulse"
                  style={{ top: `${slotTopY + 5}%`, left: turnXPercent, transform: 'translate(-50%, -50%)' }}
                />
              </>
            )
          })()}

          {/* User Position Marker */}
          {isNavigating && (
            <div
              className="absolute z-30 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-in-out"
              style={{ left: `${userPosition.x}%`, top: `${userPosition.y}%` }}
            >
              {/* User dot */}
              <div className="relative">
                <div className="w-7 h-7 bg-[#38BDF8] rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <div className="absolute inset-0 w-7 h-7 bg-[#38BDF8] rounded-full animate-ping opacity-30"></div>
              </div>
              {/* Label */}
              <div className="absolute top-9 left-1/2 -translate-x-1/2 bg-[#38BDF8] text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow">
                BAN O DAY
              </div>
            </div>
          )}

          {/* Zone Gate */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white text-[#1E293B] px-6 py-2 rounded-full font-bold shadow-lg text-sm z-10 border-t-4 border-[#0284C7]">
            CONG VAO
          </div>

          {/* Zone Label */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-[#0284C7] text-white px-4 py-1.5 rounded-full font-bold text-sm z-10">
            {zone?.name || 'Khu vuc'}
          </div>

          {/* Column Labels */}
          <div className="absolute left-[20%] top-[5%] -translate-x-1/2 text-white/60 text-xs font-medium">
            HANG TRAI
          </div>
          <div className="absolute right-[20%] top-[5%] translate-x-1/2 text-white/60 text-xs font-medium">
            HANG PHAI
          </div>
        </div>
      </div>

      {/* Navigation Instructions Panel */}
      {isNavigating && navigationSteps.length > 0 && (
        <div className="bg-white border-t border-[#64748B]/20 px-6 py-4 max-h-[35%] overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Route size={18} className="text-[#0284C7]" />
              <h3 className="font-bold text-[#1E293B]">Huong dan di vao o do xe</h3>
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
              {isSimulating ? 'Dang mo phong...' : 'Xem mo phong'}
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
                    {isCompleted ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <StepIcon size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${
                      isCompleted 
                        ? 'text-[#10B981]' 
                        : isActive 
                          ? 'text-[#0284C7]' 
                          : 'text-[#64748B]'
                    }`}>
                      {step.text}
                    </p>
                    <p className={`text-sm ${
                      isCompleted || isActive ? 'text-[#64748B]' : 'text-slate-400'
                    }`}>
                      {step.detail}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted 
                      ? 'bg-[#10B981] text-white' 
                      : isActive
                        ? 'bg-[#0284C7] text-white'
                        : 'bg-slate-200 text-[#64748B]'
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
            <div className="w-3 h-3 rounded bg-[#10B981]/20 border border-[#10B981]"></div>
            <span className="text-[#64748B]">Trong</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#EF4444]/20 border border-[#EF4444]"></div>
            <span className="text-[#64748B]">Da do</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#10B981] border border-[#10B981]"></div>
            <span className="text-[#64748B]">Da chon</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#38BDF8] border-2 border-white"></div>
            <span className="text-[#64748B]">Vi tri ban</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-0.5 border-t-2 border-dashed border-[#38BDF8]"></div>
            <span className="text-[#64748B]">Duong di</span>
          </div>
        </div>
      </div>
    </div>
  )
}

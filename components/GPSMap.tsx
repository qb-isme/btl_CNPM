"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { Navigation, MapPin, Car, Clock, Route, X, Locate, Compass, AlertCircle } from 'lucide-react'

// Vị trí bãi xe thực tế - Đại học Bách Khoa TP.HCM
const PARKING_CENTER = { lat: 10.8800, lng: 106.8056 }

// Kích thước sơ đồ (tính theo mét)
const MAP_WIDTH_METERS = 200 // 200m chiều rộng thực tế
const MAP_HEIGHT_METERS = 150 // 150m chiều cao thực tế

// Vị trí các khu trên sơ đồ (tọa độ % trên canvas)
const zoneLocations: Record<string, { x: number; y: number; name: string; gps: { lat: number; lng: number } }> = {
  'A': { x: 16.67, y: 25, name: 'Khu A - Cổng chính', gps: { lat: 10.8805, lng: 106.8050 } },
  'B': { x: 50, y: 25, name: 'Khu B - Thư viện', gps: { lat: 10.8810, lng: 106.8060 } },
  'C': { x: 83.33, y: 25, name: 'Khu C - Căn tin', gps: { lat: 10.8795, lng: 106.8065 } },
  'D': { x: 16.67, y: 75, name: 'Khu D - Hội trường', gps: { lat: 10.8815, lng: 106.8045 } },
  'E': { x: 50, y: 75, name: 'Khu E - Ký túc xá', gps: { lat: 10.8790, lng: 106.8055 } },
  'F': { x: 83.33, y: 75, name: 'Khu F - Sân vận động', gps: { lat: 10.8808, lng: 106.8070 } },
}

interface GPSMapProps {
  selectedZoneId: string | null
  selectedSlotName: string | null
  isNavigating: boolean
  onClose: () => void
}

// Hàm tính khoảng cách giữa 2 điểm GPS (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000 // Bán kính trái đất (m)
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Hàm chuyển đổi tọa độ GPS thành vị trí trên sơ đồ (%)
function gpsToMapPosition(lat: number, lng: number): { x: number; y: number } | null {
  // Tính khoảng cách từ tâm bãi xe
  const distanceFromCenter = calculateDistance(lat, lng, PARKING_CENTER.lat, PARKING_CENTER.lng)
  
  // Nếu quá xa (> 500m), không hiển thị trên sơ đồ
  if (distanceFromCenter > 500) return null
  
  // Tính độ lệch theo mét
  const deltaLat = (lat - PARKING_CENTER.lat) * 111320 // 1 độ lat ~ 111.32km
  const deltaLng = (lng - PARKING_CENTER.lng) * 111320 * Math.cos(PARKING_CENTER.lat * Math.PI / 180)
  
  // Chuyển sang % trên sơ đồ (50% là tâm)
  const x = 50 + (deltaLng / MAP_WIDTH_METERS) * 100
  const y = 50 - (deltaLat / MAP_HEIGHT_METERS) * 100 // Y ngược (trên màn hình y tăng xuống dưới)
  
  // Giới hạn trong khoảng 5-95%
  return {
    x: Math.max(5, Math.min(95, x)),
    y: Math.max(5, Math.min(95, y))
  }
}

export default function GPSMap({ selectedZoneId, selectedSlotName, isNavigating, onClose }: GPSMapProps) {
  const [userPosition, setUserPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [userMapPosition, setUserMapPosition] = useState<{ x: number; y: number } | null>(null)
  const [accuracy, setAccuracy] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [gpsError, setGpsError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(true)
  const [heading, setHeading] = useState<number | null>(null)
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const destination = selectedZoneId ? zoneLocations[selectedZoneId] : null

  // Lấy vị trí GPS và theo dõi real-time
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Trình duyệt không hỗ trợ GPS')
      // Fallback - giả lập vị trí gần bãi xe
      const fallbackPos = { lat: 10.8785, lng: 106.8040 }
      setUserPosition(fallbackPos)
      setUserMapPosition(gpsToMapPosition(fallbackPos.lat, fallbackPos.lng))
      setIsLoading(false)
      return
    }

    // Lấy vị trí ban đầu
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPosition(newPos)
        setUserMapPosition(gpsToMapPosition(newPos.lat, newPos.lng))
        setAccuracy(pos.coords.accuracy)
        setIsLoading(false)
        if (pos.coords.heading) setHeading(pos.coords.heading)
      },
      (err) => {
        console.log('[v0] GPS Error:', err.message)
        setGpsError(err.message)
        // Fallback
        const fallbackPos = { lat: 10.8785, lng: 106.8040 }
        setUserPosition(fallbackPos)
        setUserMapPosition(gpsToMapPosition(fallbackPos.lat, fallbackPos.lng))
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  // Theo dõi GPS real-time
  useEffect(() => {
    if (!isTracking || !navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserPosition(newPos)
        setUserMapPosition(gpsToMapPosition(newPos.lat, newPos.lng))
        setAccuracy(pos.coords.accuracy)
        if (pos.coords.heading) setHeading(pos.coords.heading)
        setGpsError(null)
      },
      (err) => {
        console.log('[v0] GPS Watch Error:', err.message)
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [isTracking])

  // Tính khoảng cách và thời gian đến đích
  useEffect(() => {
    if (!userPosition || !destination || !isNavigating) {
      setRouteInfo(null)
      return
    }

    const distanceMeters = calculateDistance(
      userPosition.lat, userPosition.lng,
      destination.gps.lat, destination.gps.lng
    )
    
    const distanceDisplay = distanceMeters >= 1000 
      ? `${(distanceMeters / 1000).toFixed(2)} km`
      : `${Math.round(distanceMeters)} m`
    
    // Giả sử đi bộ 1.2m/s
    const durationSeconds = distanceMeters / 1.2
    const durationMinutes = Math.ceil(durationSeconds / 60)
    
    setRouteInfo({
      distance: distanceDisplay,
      duration: `${durationMinutes} phút`
    })
  }, [userPosition, destination, isNavigating])

  // Tạo đường đi SVG path
  const generateRoutePath = useCallback(() => {
    if (!userMapPosition || !destination) return ''
    
    const startX = userMapPosition.x
    const startY = userMapPosition.y
    const endX = destination.x
    const endY = destination.y
    
    // Tạo đường đi với các góc cong
    const midY = (startY + endY) / 2
    
    return `M ${startX} ${startY} 
            L ${startX} ${midY} 
            Q ${startX} ${endY} ${(startX + endX) / 2} ${endY}
            L ${endX} ${endY}`
  }, [userMapPosition, destination])

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Dang xac dinh vi tri GPS...</p>
          <p className="text-sm text-slate-400 mt-2">Vui long cho phep truy cap vi tri</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-slate-900 flex flex-col">
      {/* Header Bar */}
      <div className="bg-white/95 backdrop-blur-sm shadow-lg z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Navigation className="text-blue-600" size={24} />
            <div>
              <h2 className="font-bold text-slate-800">So do bai xe 2D</h2>
              <p className="text-xs text-slate-500">Tich hop dinh vi GPS</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Destination info */}
        {destination && isNavigating && (
          <div className="px-4 pb-3 border-t border-slate-100">
            <div className="flex items-center gap-4 mt-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="text-green-500" />
                  <span>Diem den:</span>
                </div>
                <p className="font-bold text-slate-800">{destination.name}</p>
                {selectedSlotName && (
                  <p className="text-sm text-blue-600 font-medium">{selectedSlotName}</p>
                )}
              </div>
              {routeInfo && (
                <div className="flex gap-4">
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Route size={14} />
                      <span className="text-xs">Khoang cach</span>
                    </div>
                    <p className="font-bold text-blue-600">{routeInfo.distance}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={14} />
                      <span className="text-xs">Thoi gian</span>
                    </div>
                    <p className="font-bold text-green-600">{routeInfo.duration}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main 2D Map Area */}
      <div className="flex-1 relative overflow-hidden p-4">
        <div className="w-full h-full bg-slate-800 rounded-2xl relative border-2 border-slate-700 overflow-hidden">
          {/* Grid background */}
          <div className="absolute inset-0 opacity-20">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748b" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>

          {/* Main road */}
          <div className="absolute left-1/2 top-0 bottom-0 w-8 -translate-x-1/2 bg-slate-600 opacity-50"></div>
          <div className="absolute top-1/2 left-0 right-0 h-8 -translate-y-1/2 bg-slate-600 opacity-50"></div>

          {/* Roads dashed lines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 border-l-2 border-dashed border-yellow-500/50"></div>
          <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 border-t-2 border-dashed border-yellow-500/50"></div>

          {/* Parking Zones */}
          {Object.entries(zoneLocations).map(([id, zone]) => (
            <div
              key={id}
              className={`absolute w-24 h-16 transform -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 flex flex-col items-center justify-center transition-all ${
                selectedZoneId === id
                  ? 'bg-green-500/30 border-green-400 scale-110 shadow-lg shadow-green-500/30'
                  : 'bg-slate-700/50 border-slate-500 hover:bg-slate-700/80'
              }`}
              style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            >
              <span className="text-white font-bold text-lg">Khu {id}</span>
              <span className="text-slate-300 text-xs">{zone.name.split(' - ')[1]}</span>
            </div>
          ))}

          {/* Navigation Route */}
          {isNavigating && userMapPosition && destination && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
              <defs>
                <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3B82F6" />
                  <stop offset="100%" stopColor="#10B981" />
                </linearGradient>
              </defs>
              <path
                d={generateRoutePath()}
                fill="none"
                stroke="url(#routeGradient)"
                strokeWidth="4"
                strokeDasharray="10,5"
                strokeLinecap="round"
                className="animate-pulse"
                style={{
                  transform: 'scale(1)',
                  transformOrigin: 'center'
                }}
              />
            </svg>
          )}

          {/* Destination Marker */}
          {destination && isNavigating && (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-full z-20"
              style={{ left: `${destination.x}%`, top: `${destination.y}%` }}
            >
              <div className="relative">
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-4 bg-green-500 rounded-full animate-ping opacity-50"></div>
                <MapPin size={32} className="text-green-500 drop-shadow-lg" fill="#10B981" />
              </div>
            </div>
          )}

          {/* User Position Marker */}
          {userMapPosition ? (
            <div
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
              style={{ left: `${userMapPosition.x}%`, top: `${userMapPosition.y}%` }}
            >
              {/* Accuracy circle */}
              <div
                className="absolute rounded-full bg-blue-500/20 border border-blue-400/30 -translate-x-1/2 -translate-y-1/2"
                style={{
                  width: `${Math.min(accuracy / 2, 60)}px`,
                  height: `${Math.min(accuracy / 2, 60)}px`,
                  left: '50%',
                  top: '50%'
                }}
              ></div>
              {/* User dot with direction */}
              <div className="relative">
                <div className="w-6 h-6 bg-blue-500 rounded-full border-3 border-white shadow-lg flex items-center justify-center">
                  {heading !== null && (
                    <Compass
                      size={14}
                      className="text-white"
                      style={{ transform: `rotate(${heading}deg)` }}
                    />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
              </div>
            </div>
          ) : (
            // Nếu không có vị trí GPS trên sơ đồ
            <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-yellow-500/90 text-yellow-900 px-4 py-2 rounded-lg flex items-center gap-2 z-20">
              <AlertCircle size={16} />
              <span className="text-sm font-medium">Ban dang o ngoai khu vuc bai xe</span>
            </div>
          )}

          {/* Main Gate */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-800 px-6 py-2 rounded-full font-bold shadow-lg text-sm z-10">
            CONG CHINH VAO
          </div>

          {/* Compass */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <div className="w-8 h-8 flex items-center justify-center">
              <span className="text-red-500 font-bold text-xs">N</span>
            </div>
          </div>

          {/* Scale indicator */}
          <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1 shadow-lg">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <div className="w-12 h-0.5 bg-slate-800"></div>
              <span>50m</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="bg-white/95 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
            <div>
              <p className="text-sm font-medium text-slate-800">
                {isTracking ? 'Dang theo doi GPS' : 'GPS da tam dung'}
              </p>
              <p className="text-xs text-slate-500">
                {gpsError ? `Loi: ${gpsError}` : `Do chinh xac: ${accuracy > 0 ? `${Math.round(accuracy)}m` : 'Dang xac dinh...'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle tracking */}
            <button
              onClick={() => setIsTracking(!isTracking)}
              className={`p-3 rounded-xl transition-colors ${
                isTracking ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              title={isTracking ? 'Dung theo doi' : 'Bat theo doi'}
            >
              <Locate size={20} />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
            <span className="text-slate-600">Vi tri cua ban</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} className="text-green-500" fill="#10B981" />
            <span className="text-slate-600">Diem den</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-3 rounded bg-slate-700 border border-slate-500"></div>
            <span className="text-slate-600">Khu vuc do xe</span>
          </div>
        </div>
      </div>
    </div>
  )
}

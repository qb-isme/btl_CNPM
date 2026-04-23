"use client"

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Navigation, MapPin, Car, Clock, Route, Layers, X, Locate } from 'lucide-react'

// Custom icons
const createIcon = (color: string, size: number = 25) => new L.DivIcon({
  html: `<div style="
    background-color: ${color};
    width: ${size}px;
    height: ${size}px;
    border-radius: 50%;
    border: 3px solid white;
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
  "></div>`,
  className: 'custom-marker',
  iconSize: [size, size],
  iconAnchor: [size/2, size/2],
})

const userIcon = createIcon('#3B82F6', 20)
const destinationIcon = createIcon('#10B981', 28)
const parkingIcon = createIcon('#EF4444', 22)

// Vị trí bãi xe thực tế - Đại học Bách Khoa TP.HCM (ví dụ)
const PARKING_CENTER: [number, number] = [10.8800, 106.8056]

const zoneLocations: Record<string, { position: [number, number], name: string }> = {
  'A': { position: [10.8805, 106.8050], name: 'Khu A - Cổng chính' },
  'B': { position: [10.8810, 106.8060], name: 'Khu B - Thư viện' },
  'C': { position: [10.8795, 106.8065], name: 'Khu C - Căn tin' },
  'D': { position: [10.8815, 106.8045], name: 'Khu D - Hội trường' },
  'E': { position: [10.8790, 106.8055], name: 'Khu E - Ký túc xá' },
  'F': { position: [10.8808, 106.8070], name: 'Khu F - Sân vận động' },
}

// Component cập nhật map view
function MapController({ center, zoom, shouldFly }: { center: [number, number], zoom: number, shouldFly: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (shouldFly) {
      map.flyTo(center, zoom, { duration: 1 })
    }
  }, [map, center, zoom, shouldFly])
  return null
}

// Component theo dõi GPS real-time
function GPSTracker({ onUpdate, isActive }: { onUpdate: (pos: [number, number], accuracy: number) => void, isActive: boolean }) {
  const map = useMap()
  
  useEffect(() => {
    if (!isActive || !navigator.geolocation) return
    
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        onUpdate(newPos, pos.coords.accuracy)
      },
      (err) => console.log('[v0] GPS Error:', err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
    
    return () => navigator.geolocation.clearWatch(watchId)
  }, [map, onUpdate, isActive])
  
  return null
}

interface GPSMapProps {
  selectedZoneId: string | null
  selectedSlotName: string | null
  isNavigating: boolean
  onClose: () => void
}

export default function GPSMap({ selectedZoneId, selectedSlotName, isNavigating, onClose }: GPSMapProps) {
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null)
  const [accuracy, setAccuracy] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street')
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([])
  const [routeInfo, setRouteInfo] = useState<{ distance: string, duration: string } | null>(null)
  const [isTracking, setIsTracking] = useState(true)
  const [shouldFlyToUser, setShouldFlyToUser] = useState(false)
  
  const destination = selectedZoneId ? zoneLocations[selectedZoneId] : null
  
  // Lấy vị trí ban đầu
  useEffect(() => {
    if (!navigator.geolocation) {
      // Fallback position gần bãi xe
      setUserPosition([10.8785, 106.8040])
      setIsLoading(false)
      return
    }
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPosition([pos.coords.latitude, pos.coords.longitude])
        setAccuracy(pos.coords.accuracy)
        setIsLoading(false)
      },
      () => {
        // Fallback nếu không có GPS
        setUserPosition([10.8785, 106.8040])
        setIsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }, [])
  
  // Fetch route từ OSRM API (miễn phí)
  useEffect(() => {
    if (!userPosition || !destination || !isNavigating) {
      setRouteCoords([])
      setRouteInfo(null)
      return
    }
    
    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${userPosition[1]},${userPosition[0]};${destination.position[1]},${destination.position[0]}?overview=full&geometries=geojson`
        
        const res = await fetch(url)
        const data = await res.json()
        
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0]
          const coords: [number, number][] = route.geometry.coordinates.map(
            (c: [number, number]) => [c[1], c[0]] as [number, number]
          )
          setRouteCoords(coords)
          
          // Tính khoảng cách và thời gian
          const distanceKm = (route.distance / 1000).toFixed(2)
          const durationMin = Math.ceil(route.duration / 60)
          setRouteInfo({
            distance: `${distanceKm} km`,
            duration: `${durationMin} phút`
          })
        }
      } catch (error) {
        console.log('[v0] Route fetch error:', error)
        // Fallback - vẽ đường thẳng
        setRouteCoords([userPosition, destination.position])
        
        // Tính khoảng cách đường chim bay
        const R = 6371
        const dLat = (destination.position[0] - userPosition[0]) * Math.PI / 180
        const dLon = (destination.position[1] - userPosition[1]) * Math.PI / 180
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userPosition[0] * Math.PI / 180) * Math.cos(destination.position[0] * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        const distance = R * c
        
        setRouteInfo({
          distance: `${distance.toFixed(2)} km`,
          duration: `${Math.ceil(distance / 0.5)} phút` // Giả sử đi bộ 0.5km/phút
        })
      }
    }
    
    fetchRoute()
  }, [userPosition, destination, isNavigating])
  
  const handleLocationUpdate = useCallback((pos: [number, number], acc: number) => {
    setUserPosition(pos)
    setAccuracy(acc)
  }, [])
  
  const handleCenterOnUser = () => {
    setShouldFlyToUser(true)
    setTimeout(() => setShouldFlyToUser(false), 1000)
  }
  
  const mapCenter = userPosition || PARKING_CENTER
  
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">Đang xác định vị trí GPS...</p>
          <p className="text-sm text-slate-400 mt-2">Vui lòng cho phép truy cập vị trí</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full bg-slate-900">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-sm shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Navigation className="text-blue-600" size={24} />
            <div>
              <h2 className="font-bold text-slate-800">Dẫn đường GPS</h2>
              <p className="text-xs text-slate-500">Cập nhật thời gian thực</p>
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
                  <span>Điểm đến:</span>
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
                      <span className="text-xs">Khoảng cách</span>
                    </div>
                    <p className="font-bold text-blue-600">{routeInfo.distance}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Clock size={14} />
                      <span className="text-xs">Thời gian</span>
                    </div>
                    <p className="font-bold text-green-600">{routeInfo.duration}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Map Controls */}
      <div className="absolute top-32 right-4 z-[1000] flex flex-col gap-2">
        {/* Layer toggle */}
        <button
          onClick={() => setMapType(mapType === 'street' ? 'satellite' : 'street')}
          className="bg-white p-3 rounded-xl shadow-lg hover:bg-slate-50 transition-colors"
          title="Đổi kiểu bản đồ"
        >
          <Layers size={20} className="text-slate-600" />
        </button>
        
        {/* Center on user */}
        <button
          onClick={handleCenterOnUser}
          className="bg-white p-3 rounded-xl shadow-lg hover:bg-slate-50 transition-colors"
          title="Về vị trí của tôi"
        >
          <Locate size={20} className="text-blue-600" />
        </button>
        
        {/* Toggle tracking */}
        <button
          onClick={() => setIsTracking(!isTracking)}
          className={`p-3 rounded-xl shadow-lg transition-colors ${
            isTracking ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
          }`}
          title={isTracking ? 'Dừng theo dõi' : 'Bật theo dõi'}
        >
          <Navigation size={20} />
        </button>
      </div>

      {/* Bottom Info Panel */}
      <div className="absolute bottom-4 left-4 right-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`}></div>
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {isTracking ? 'Đang theo dõi GPS' : 'GPS đã tạm dừng'}
                </p>
                <p className="text-xs text-slate-500">
                  Độ chính xác: {accuracy > 0 ? `${Math.round(accuracy)}m` : 'Đang xác định...'}
                </p>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                <span className="text-slate-600">Bạn</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow"></div>
                <span className="text-slate-600">Đích</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow"></div>
                <span className="text-slate-600">Bãi xe</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Map Container */}
      <MapContainer
        center={mapCenter}
        zoom={17}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        {/* Map tiles */}
        {mapType === 'street' ? (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        ) : (
          <TileLayer
            attribution='&copy; Esri'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        )}
        
        {/* GPS Tracker */}
        <GPSTracker onUpdate={handleLocationUpdate} isActive={isTracking} />
        
        {/* Map controller */}
        {shouldFlyToUser && userPosition && (
          <MapController center={userPosition} zoom={18} shouldFly={true} />
        )}
        
        {/* User position with accuracy circle */}
        {userPosition && (
          <>
            <Circle
              center={userPosition}
              radius={accuracy}
              pathOptions={{
                color: '#3B82F6',
                fillColor: '#3B82F6',
                fillOpacity: 0.15,
                weight: 2
              }}
            />
            <Marker position={userPosition} icon={userIcon}>
              <Popup>
                <div className="text-center p-1">
                  <p className="font-bold text-blue-600">Vị trí của bạn</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {userPosition[0].toFixed(6)}, {userPosition[1].toFixed(6)}
                  </p>
                  <p className="text-xs text-slate-400">
                    Độ chính xác: ~{Math.round(accuracy)}m
                  </p>
                </div>
              </Popup>
            </Marker>
          </>
        )}
        
        {/* Destination marker */}
        {destination && isNavigating && (
          <Marker position={destination.position} icon={destinationIcon}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-green-600">{destination.name}</p>
                {selectedSlotName && (
                  <p className="text-sm text-blue-600 mt-1">{selectedSlotName}</p>
                )}
              </div>
            </Popup>
          </Marker>
        )}
        
        {/* All parking zones */}
        {Object.entries(zoneLocations).map(([id, zone]) => (
          <Marker key={id} position={zone.position} icon={parkingIcon}>
            <Popup>
              <div className="text-center p-1">
                <p className="font-bold text-red-600">Khu {id}</p>
                <p className="text-xs text-slate-500">{zone.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            positions={routeCoords}
            pathOptions={{
              color: '#3B82F6',
              weight: 5,
              opacity: 0.8,
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}

'use client';

interface Zone {
  id: string;
  name: string;
  totalSlots: number;
  availableSlots: number;
  occupiedSlots: number;
  occupancyRate: number | null;
  status: string;
}

interface ZonesGridProps {
  zones: Zone[];
  loading: boolean;
  onZoneClick: (zone: Zone) => void;
}

export default function ZonesGrid({ zones, loading, onZoneClick }: ZonesGridProps) {
  const getZoneClass = (zone: Zone) => {
    if (zone.status === 'maintenance') return 'maintenance';
    if (zone.availableSlots === 0) return 'full';
    if (zone.occupancyRate !== null && zone.occupancyRate >= 80) return 'almost-full';
    if (zone.availableSlots === zone.totalSlots) return 'empty';
    return 'available';
  };

  const getDisplayCount = (zone: Zone) => {
    if (zone.status === 'maintenance') return '--/100';
    return `${zone.availableSlots}/${zone.totalSlots}`;
  };

  if (loading) {
    return (
      <div className="zones-grid">
        <div className="loading-container">
          <div className="spinner-border text-light" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="zones-grid">
      {zones.map((zone) => (
        <div
          key={zone.id}
          className={`zone-card ${getZoneClass(zone)}`}
          onClick={() => zone.status !== 'maintenance' && onZoneClick(zone)}
          style={{ pointerEvents: zone.status === 'maintenance' ? 'none' : 'auto' }}
        >
          <div className="zone-name">{zone.name}</div>
          <div className="zone-count">{getDisplayCount(zone)}</div>
        </div>
      ))}
    </div>
  );
}

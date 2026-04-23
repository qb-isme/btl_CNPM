'use client';

interface SidebarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export default function Sidebar({ searchQuery, onSearchChange }: SidebarProps) {
  return (
    <div className="col-md-3">
      {/* Search Box */}
      <div className="card mb-4">
        <div className="card-body">
          <h6 className="card-title">
            <i className="bi bi-search me-2"></i>TIM KIEM KHU VUC
          </h6>
          <input
            type="text"
            className="form-control"
            placeholder="Nhap ten phan khu"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="card">
        <div className="card-body">
          <h6 className="card-title mb-3">CHU GIAI TRANG THAI</h6>
          <div className="legend-item">
            <span className="legend-color bg-success"></span>
            <span>Con cho</span>
          </div>
          <div className="legend-item">
            <span className="legend-color bg-warning"></span>
            <span>Gan day</span>
          </div>
          <div className="legend-item">
            <span className="legend-color bg-danger"></span>
            <span>Het cho</span>
          </div>
          <div className="legend-item">
            <span className="legend-color bg-secondary"></span>
            <span>Mat tin hieu</span>
          </div>
          <div className="legend-item">
            <span className="legend-icon">
              <i className="bi bi-tools text-muted"></i>
            </span>
            <span>Bao tri/ dong cua</span>
          </div>
        </div>
      </div>
    </div>
  );
}

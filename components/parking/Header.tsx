'use client';

import { useState, useEffect } from 'react';

export default function Header() {
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour12: false }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header-main">
      <div className="container-fluid">
        <div className="row align-items-center py-2">
          <div className="col-md-4">
            <h1 className="h5 mb-0 text-white">He thong quan ly bai xe</h1>
            <small className="text-white-50">BAN DO & DINH VI • SINH VIEN</small>
          </div>
          <div className="col-md-4 text-center">
            <div className="time-display">{currentTime}</div>
          </div>
          <div className="col-md-4 text-end">
            <span className="badge bg-success me-2">
              <i className="bi bi-circle-fill me-1"></i> Online
            </span>
            <div className="d-inline-flex align-items-center">
              <div className="user-avatar">
                <i className="bi bi-person-fill"></i>
              </div>
              <span className="text-white ms-2">Nguyen Van A</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
  const [currentTime, setCurrentTime] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('vi-VN', { hour12: false }));
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { href: '/', label: 'Bản đồ & Định vị' },
    { href: '/gate-ops', label: 'Vận hành cổng' },
  ];

  return (
    <header className="header-main">
      <div className="container-fluid">
        <div className="row align-items-center py-2">
          <div className="col-md-3">
            <h1 className="h5 mb-0 text-white">He thong quan ly bai xe</h1>
            <small className="text-white-50">QUAN LY BAI XE THONG MINH</small>
          </div>
          <div className="col-md-5">
            <nav className="d-flex gap-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1 rounded text-decoration-none text-sm fw-semibold transition-all ${
                    pathname === link.href
                      ? 'bg-white text-dark'
                      : 'text-white-50 hover:text-white'
                  }`}
                  style={{
                    fontSize: '0.85rem',
                    backgroundColor: pathname === link.href ? 'white' : 'rgba(255,255,255,0.1)',
                    color: pathname === link.href ? '#1E293B' : 'rgba(255,255,255,0.7)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 12px',
                    textDecoration: 'none',
                  }}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="col-md-4 text-end">
            <div className="time-display d-inline me-3" style={{ fontSize: '0.95rem' }}>{currentTime}</div>
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

"use client"
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Map, LayoutDashboard, User, LogOut, ShieldAlert } from 'lucide-react';

export default function Header() {
  const pathname = usePathname(); // Lấy đường dẫn hiện tại để highlight tab đang chọn
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState('');

  // Cập nhật đồng hồ thời gian thực
  useEffect(() => {
    const updateTime = () => setCurrentTime(new Date().toLocaleTimeString('vi-VN'));
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Danh sách các phân hệ trong hệ thống
  const navItems = [
    { name: 'Bản đồ bãi xe', path: '/map', icon: <Map size={18} /> },
    { name: 'Quản lý User', path: '/dashboard', icon: <LayoutDashboard size={18} /> },
    // Sau này có trang checkin, bạn chỉ cần thêm 1 dòng vào đây:
    // { name: 'Trạm gác (Bảo vệ)', path: '/gate-ops', icon: <ShieldAlert size={18} /> },
  ];

  const handleLogout = () => {
    // Xóa session/token (nếu có) rồi đẩy về trang chủ (form đăng nhập)
    router.push('/');
  };

  return (
    <header className="bg-[#E2E8F0] p-4 flex justify-between items-center shadow-sm w-full">
      {/* 1. Logo & Tiêu đề */}
      <div className="flex items-center gap-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1E293B]">BK-PARKING</h1>
          <p className="text-[10px] font-black text-[#0284C7] uppercase tracking-widest">Hệ thống thông minh</p>
        </div>

        {/* 2. Thanh Menu Điều Hướng (Navigation Tabs) */}
        <nav className="hidden md:flex items-center gap-1 bg-white/50 p-1 rounded-xl border border-white">
          {navItems.map((item) => {
            const isActive = pathname?.startsWith(item.path);
            return (
              <Link 
                key={item.path} 
                href={item.path}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all
                  ${isActive 
                    ? 'bg-[#0284C7] text-white shadow-md' 
                    : 'text-[#64748B] hover:text-[#1E293B] hover:bg-white'}`}
              >
                {item.icon} {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
      
      {/* 3. Khu vực Đồng hồ & Thông tin User */}
      <div className="flex items-center gap-6">
        <div className="bg-white px-6 py-2 rounded-full font-mono text-lg shadow-sm border border-[#64748B]/20">
          {currentTime}
        </div>
        
        <div className="bg-[#D1FAE5] text-[#10B981] px-4 py-2 rounded-full font-bold text-sm shadow-sm flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div> Online
        </div>
        
        <div className="flex items-center gap-3 ml-2 border-l border-[#64748B]/30 pl-6">
          <div className="flex flex-col items-end">
            <span className="text-sm font-bold text-[#1E293B]">Quốc Bảo</span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase">Admin</span>
          </div>
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-[#64748B]/20">
            <User className="text-[#0284C7]" size={20} />
          </div>
          
          {/* Nút Đăng xuất */}
          <button 
            onClick={handleLogout}
            className="ml-2 w-10 h-10 bg-white text-[#EF4444] rounded-full flex items-center justify-center shadow-sm border border-[#64748B]/20 hover:bg-red-50 hover:scale-105 transition-all"
            title="Đăng xuất"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, ShieldCheck, User, Lock, ArrowRight, Info } from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Giả lập logic kiểm tra đăng nhập
    // Trong thực tế, bạn sẽ gọi API xác thực tại đây
    setTimeout(() => {
      setLoading(false);
      // Sau khi đăng nhập thành công, chuyển hướng vào trang tính năng chính (ví dụ: /map)
      router.push('/map'); 
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col md:flex-row font-sans">
      
      {/* CỘT TRÁI: GIỚI THIỆU DỰ ÁN */}
      <div className="w-full md:w-1/2 bg-[#0284C7] p-12 flex flex-col justify-center text-white relative overflow-hidden">
        {/* Họa tiết trang trí phía sau */}
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>

        <div className="relative z-10 max-w-lg">
          <div className="bg-white/20 p-3 rounded-2xl w-fit mb-6 backdrop-blur-md">
            <Car size={48} className="text-white" />
          </div>
          <h1 className="text-5xl font-black mb-6 leading-tight uppercase tracking-tight">
            IoT Smart <br /> Parking System
          </h1>
          <p className="text-blue-100 text-lg mb-8 leading-relaxed">
            Hệ thống quản lý bãi đỗ xe thông minh tối ưu cho khuôn viên trường đại học. 
            Giải pháp tích hợp công nghệ IoT, định vị thời gian thực và thanh toán trực tuyến BKPay.
          </p>

          <div className="space-y-4">
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <ShieldCheck className="text-blue-200" />
              <span className="text-sm font-medium">Bảo mật thông tin & Định danh thẻ tập trung</span>
            </div>
            <div className="flex items-center gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10">
              <Info className="text-blue-200" />
              <span className="text-sm font-medium">Báo cáo sự cố & Phản hồi nhanh chóng 24/7</span>
            </div>
          </div>
        </div>
        
        <div className="absolute bottom-12 left-12 text-blue-200 text-xs font-bold tracking-widest uppercase">
          Đồ án Công nghệ phần mềm • Nhóm L01
        </div>
      </div>

      {/* CỘT PHẢI: FORM ĐĂNG NHẬP */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#1E293B] mb-2">Chào mừng trở lại</h2>
            <p className="text-[#64748B]">Vui lòng đăng nhập để truy cập các tính năng hệ thống.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-[#1E293B] ml-1">Tài khoản</label>
              <div className="relative">
                <input 
                  required
                  type="text" 
                  placeholder="MSSV hoặc Email cán bộ"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#CBD5E1] focus:outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-blue-50 transition-all text-[#1E293B]"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                />
                <User className="absolute left-4 top-4 text-[#94A3B8]" size={24} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-bold text-[#1E293B]">Mật khẩu</label>
                <a href="#" className="text-xs font-bold text-[#0284C7] hover:underline">Quên mật khẩu?</a>
              </div>
              <div className="relative">
                <input 
                  required
                  type="password" 
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#CBD5E1] focus:outline-none focus:border-[#0284C7] focus:ring-4 focus:ring-blue-50 transition-all text-[#1E293B]"
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                />
                <Lock className="absolute left-4 top-4 text-[#94A3B8]" size={24} />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-4 bg-[#1E293B] text-white rounded-2xl font-bold text-lg hover:bg-[#0F172A] transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  Đăng nhập hệ thống <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-sm text-[#64748B]">
              Bạn gặp sự cố đăng nhập? <br />
              <span className="text-[#1E293B] font-bold cursor-pointer hover:text-[#0284C7]">Liên hệ Ban quản lý bãi xe</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
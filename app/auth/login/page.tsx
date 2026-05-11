"use client"
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, User, Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Giả lập logic xác thực
    setTimeout(() => {
      router.push('/dashboard');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-[#E2E8F0] flex items-center justify-center p-4 font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-[#64748B]/20 relative">
        <Link href="/" className="absolute top-6 left-6 text-[#64748B] hover:text-[#0284C7] transition-colors">
          <ArrowLeft size={24} />
        </Link>
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[#0284C7] rounded-full flex items-center justify-center mb-4 shadow-inner">
            <ShieldAlert size={32} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-[#1E293B]">BK-Parking Login</h2>
          <p className="text-[#64748B] text-sm mt-2 font-medium uppercase tracking-widest">Hệ thống quản trị</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider ml-1">Tài khoản MSSV</label>
            <div className="relative">
              <input 
                required
                type="text" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#64748B]/40 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                placeholder="24xxxxx"
              />
              <User className="absolute left-3 top-3.5 text-[#64748B]" size={20} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider ml-1">Mật khẩu</label>
            <div className="relative">
              <input 
                required
                type="password" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#64748B]/40 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7]"
                placeholder="••••••••"
              />
              <Lock className="absolute left-3 top-3.5 text-[#64748B]" size={20} />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-[#0284C7] text-white rounded-xl font-bold hover:bg-[#0369A1] transition-all shadow-md active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? "Đang xác thực..." : "Đăng nhập ngay"}
          </button>
        </form>
      </div>
    </div>
  );
}
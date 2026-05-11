"use client"
import React, { useState } from 'react';
import Header from '@/components/parking/Header';
import { UserCircle, Wallet, AlertCircle, History, Car as CarIcon, Bike, CreditCard } from 'lucide-react';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState<'xe-may' | 'o-to'>('xe-may');

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B]">
      {/* Thanh điều hướng tổng */}
      <Header />
      
      <main className="p-8 max-w-7xl mx-auto h-[calc(100vh-80px)] overflow-y-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1E293B]">Quản lý thông tin & Phương tiện</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI: THÔNG TIN CÁ NHÂN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#64748B]/20">
              <h2 className="text-lg font-bold mb-6 border-b pb-2 flex items-center gap-2">
                <UserCircle className="text-[#0284C7]" /> Thông tin cá nhân
              </h2>
              
              <div className="flex flex-col items-center mb-6">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4 border-4 border-white shadow-md">
                  <UserCircle size={48} className="text-[#94A3B8]" />
                </div>
                <h3 className="text-xl font-black text-[#1E293B]">Trần Hoàng Quốc Bảo</h3>
                <span className="text-sm font-bold text-[#0284C7] bg-blue-50 px-3 py-1 rounded-full mt-2">Sinh viên</span>
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#64748B]">MSSV</span>
                  <span className="font-bold">2410297</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Khoa</span>
                  <span className="font-bold text-right">Khoa học & Kỹ thuật<br/>Máy tính</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#64748B]">Email</span>
                  <span className="font-bold">bao.tran2410297@hcmut.edu.vn</span>
                </div>
              </div>
            </div>

            {/* Ví BKPay */}
            <div className="bg-gradient-to-br from-[#0284C7] to-[#0369A1] p-6 rounded-3xl shadow-md text-white">
              <div className="flex items-center gap-2 text-blue-100 mb-2 font-medium">
                <Wallet size={20} /> Số dư BKPay
              </div>
              <div className="text-4xl font-black mb-6">50,000 <span className="text-xl">VNĐ</span></div>
              <button className="w-full bg-white text-[#0284C7] py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-blue-50 transition-colors">
                <CreditCard size={18} /> Nạp tiền vào ví
              </button>
            </div>
          </div>

          {/* CỘT PHẢI: PHƯƠNG TIỆN & LỊCH SỬ */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Phương tiện của tôi */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#64748B]/20">
              <div className="flex justify-between items-center mb-6 border-b pb-2">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <CarIcon className="text-[#0284C7]" /> Phương tiện của tôi
                </h2>
                <div className="flex gap-2 bg-slate-100 p-1 rounded-lg">
                  <button 
                    onClick={() => setActiveTab('xe-may')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'xe-may' ? 'bg-white text-[#0284C7] shadow-sm' : 'text-[#64748B]'}`}
                  >
                    Xe máy
                  </button>
                  <button 
                    onClick={() => setActiveTab('o-to')}
                    className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'o-to' ? 'bg-white text-[#0284C7] shadow-sm' : 'text-[#64748B]'}`}
                  >
                    Ô tô
                  </button>
                </div>
              </div>

              {activeTab === 'xe-may' ? (
                <div className="border border-slate-200 p-4 rounded-2xl flex items-center justify-between hover:border-[#0284C7] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#0284C7]">
                      <Bike size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-lg">Honda Vision</h4>
                      <p className="text-[#64748B] font-mono font-medium">59-S1 123.45</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-[#64748B] font-bold uppercase mb-1">Trạng thái</p>
                      <span className="bg-[#D1FAE5] text-[#10B981] px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]"></span> Đang gửi (Khu A)
                      </span>
                    </div>
                    <button className="flex items-center gap-1.5 text-[#EF4444] bg-red-50 px-3 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors">
                      <AlertCircle size={16} /> Báo cáo sự cố
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[#64748B]">
                  <CarIcon size={48} className="mx-auto mb-3 opacity-20" />
                  <p>Bạn chưa đăng ký phương tiện ô tô nào.</p>
                </div>
              )}
            </div>

            {/* Lịch sử gửi xe */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-[#64748B]/20">
              <h2 className="text-lg font-bold mb-6 border-b pb-2 flex items-center gap-2">
                <History className="text-[#0284C7]" /> Lịch sử gửi xe gần đây
              </h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-[#64748B] font-bold">
                    <tr>
                      <th className="px-4 py-3 rounded-l-xl">Thời gian</th>
                      <th className="px-4 py-3">Khu vực</th>
                      <th className="px-4 py-3">Trạng thái</th>
                      <th className="px-4 py-3 rounded-r-xl text-right">Phí (VNĐ)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium">12/05/2026<br/><span className="text-xs text-[#64748B] font-normal">07:30 - 11:45</span></td>
                      <td className="px-4 py-4 font-bold text-[#0284C7]">Khu A</td>
                      <td className="px-4 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">Hoàn thành</span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-[#EF4444]">-5,000đ</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium">11/05/2026<br/><span className="text-xs text-[#64748B] font-normal">08:15 - 16:30</span></td>
                      <td className="px-4 py-4 font-bold text-[#0284C7]">Khu B</td>
                      <td className="px-4 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">Hoàn thành</span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-[#EF4444]">-5,000đ</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4 font-medium">10/05/2026<br/><span className="text-xs text-[#64748B] font-normal">09:00 - 12:00</span></td>
                      <td className="px-4 py-4 font-bold text-[#0284C7]">Khu A</td>
                      <td className="px-4 py-4">
                        <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold">Hoàn thành</span>
                      </td>
                      <td className="px-4 py-4 text-right font-mono font-bold text-[#EF4444]">-5,000đ</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
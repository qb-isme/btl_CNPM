'use client';

import { useState, useEffect, useCallback } from 'react';
import { User, ShieldAlert, Siren, ArrowLeft, Clock, Wifi } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import ExitException from '@/components/gate-ops/ExitException';
import SecurityAlertPanel from '@/components/gate-ops/SecurityAlertPanel';
import EmergencyBarrier from '@/components/gate-ops/EmergencyBarrier';
import { securityAlerts } from '@/lib/parking-data';

type ToastItem = {
  id: number;
  message: string;
  type: 'success' | 'error';
};

type ActivePanel = 'exception' | 'security' | 'emergency';

export default function GateOpsPage() {
  const [currentTime, setCurrentTime] = useState('');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('exception');
  const [hasActiveAlerts] = useState(securityAlerts.filter(a => !a.resolved).length > 0);

  useEffect(() => {
    const update = () => setCurrentTime(new Date().toLocaleTimeString('vi-VN', { hour12: false }));
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const NAV_ITEMS: { key: ActivePanel; label: string; icon: React.ReactNode; alert?: boolean }[] = [
    { key: 'exception', label: 'Xử lý ngoại lệ ra cổng', icon: <ShieldAlert size={18} /> },
    { key: 'security', label: 'Cảnh báo an ninh', icon: <ShieldAlert size={18} />, alert: hasActiveAlerts },
    { key: 'emergency', label: 'Mở barrier khẩn cấp', icon: <Siren size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B] flex flex-col">
      {/* Header */}
      <header className="bg-[#1E293B] px-6 py-3 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-[#94A3B8] hover:text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} /> Tổng quan
          </Link>
          <div className="w-px h-5 bg-[#64748B]/50" />
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Vận hành cổng</h1>
            <p className="text-[#94A3B8] text-xs uppercase tracking-widest">Module 5 — Gate Operations &amp; Monitoring</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 bg-[#D1FAE5]/10 border border-[#10B981]/30 px-3 py-1.5 rounded-full">
            <Wifi size={13} className="text-[#10B981]" />
            <span className="text-[#10B981] text-xs font-semibold">Online</span>
          </div>
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full font-mono text-white text-sm">
            <Clock size={13} className="text-[#94A3B8]" />
            {currentTime}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0284C7] rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-white text-xs font-semibold leading-tight">Bảo vệ A</span>
              <span className="text-[#94A3B8] text-[10px]">Cổng chính</span>
            </div>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Nav */}
        <nav className="w-56 bg-white border-r border-[#E2E8F0] flex flex-col pt-4 gap-1 px-2 shrink-0">
          {NAV_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => setActivePanel(item.key)}
              className={`
                flex items-center gap-2.5 px-3 py-3 rounded-xl text-sm font-medium text-left relative transition-all
                ${activePanel === item.key
                  ? 'bg-[#F0F9FF] text-[#0284C7] border border-[#0284C7]/30'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#1E293B]'}
              `}
            >
              <span className={activePanel === item.key ? 'text-[#0284C7]' : 'text-[#94A3B8]'}>
                {item.icon}
              </span>
              {item.label}
              {item.alert && (
                <span className="absolute top-2 right-2 w-2 h-2 bg-[#EF4444] rounded-full animate-pulse" />
              )}
            </button>
          ))}

          <div className="mt-auto mb-4 px-1">
            <div className="bg-[#F8FAFC] rounded-xl p-3 border border-[#E2E8F0]">
              <p className="text-[10px] text-[#94A3B8] font-medium uppercase tracking-wide mb-1">Cổng hiện tại</p>
              <p className="text-sm font-bold text-[#1E293B]">Cổng chính</p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                <span className="text-xs text-[#10B981]">Barrier sẵn sàng</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Active Alert Banner */}
          {hasActiveAlerts && activePanel !== 'security' && (
            <div
              className="mb-4 rounded-xl border-2 border-[#EF4444] bg-[#FEF2F2] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-red-50 transition-colors animate-pulse"
              style={{ animationDuration: '2s' }}
              onClick={() => setActivePanel('security')}
            >
              <div className="flex items-center gap-2 animate-none">
                <ShieldAlert size={18} className="text-[#EF4444]" />
                <span className="text-sm font-bold text-[#EF4444]">
                  Cảnh báo an ninh đang hoạt động — Nhấn để xem
                </span>
              </div>
              <Badge className="bg-[#EF4444] text-white border-transparent text-xs animate-none">
                {securityAlerts.filter(a => !a.resolved).length} cảnh báo
              </Badge>
            </div>
          )}

          {/* Panel Title */}
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#1E293B]">
              {activePanel === 'exception' && 'Xử lý ngoại lệ ra cổng'}
              {activePanel === 'security' && 'Cảnh báo an ninh'}
              {activePanel === 'emergency' && 'Điều khiển barrier khẩn cấp'}
            </h2>
            <p className="text-sm text-[#64748B] mt-0.5">
              {activePanel === 'exception' && 'Tra cứu phiên đỗ và xử lý các tình huống: mất/hỏng thẻ, lỗi hệ thống, không dữ liệu.'}
              {activePanel === 'security' && 'Xem và xử lý cảnh báo biển số không khớp hoặc phương tiện trong danh sách đen.'}
              {activePanel === 'emergency' && 'Mở barrier nhanh cho các trường hợp khẩn cấp và theo dõi phiếu sự cố.'}
            </p>
          </div>

          {/* Panels */}
          {activePanel === 'exception' && <ExitException onToast={addToast} />}
          {activePanel === 'security' && <SecurityAlertPanel onToast={addToast} />}
          {activePanel === 'emergency' && <EmergencyBarrier onToast={addToast} />}
        </main>
      </div>

      {/* Toast Notifications */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              rounded-xl px-4 py-3 text-sm font-medium shadow-lg border flex items-start gap-2 pointer-events-auto
              ${toast.type === 'success'
                ? 'bg-white border-[#10B981] text-[#1E293B]'
                : 'bg-[#FEF2F2] border-[#EF4444] text-[#EF4444]'}
            `}
          >
            <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${toast.type === 'success' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`} />
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

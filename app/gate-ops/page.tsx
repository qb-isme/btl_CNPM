'use client';

import { useState, useCallback } from 'react';
import { ShieldAlert, Siren } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ExitException from '@/components/gate-ops/ExitException';
import SecurityAlertPanel from '@/components/gate-ops/SecurityAlertPanel';
import EmergencyBarrier from '@/components/gate-ops/EmergencyBarrier';
import Header from '@/components/parking/Header';
import { securityAlerts } from '@/lib/parking-data';

type ToastItem = {
  id: number;
  message: string;
  type: 'success' | 'error';
};

type ActivePanel = 'exception' | 'security' | 'emergency';

export default function GateOpsPage() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [activePanel, setActivePanel] = useState<ActivePanel>('exception');
  const [activeAlertCount, setActiveAlertCount] = useState(securityAlerts.filter(a => !a.resolved).length);

  const addToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const NAV_ITEMS: { key: ActivePanel; label: string; icon: React.ReactNode; alert?: boolean }[] = [
    { key: 'exception', label: 'Xử lý ngoại lệ ra cổng', icon: <ShieldAlert size={18} /> },
    { key: 'security', label: 'Cảnh báo an ninh', icon: <ShieldAlert size={18} />, alert: activeAlertCount > 0 },
    { key: 'emergency', label: 'Mở barrier khẩn cấp', icon: <Siren size={18} /> },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B] flex flex-col">
      <Header />

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
                <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                <span className="text-xs font-semibold text-[#10B981]">Barrier sẵn sàng</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Active Alert Banner */}
          {activeAlertCount > 0 && activePanel !== 'security' && (
            <div
              className="mb-4 rounded-xl border-2 border-[#EF4444] bg-[#FEF2F2] px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-red-50 transition-colors"
              onClick={() => setActivePanel('security')}
            >
              <div className="flex items-center gap-2">
                <ShieldAlert size={18} className="text-[#EF4444]" />
                <span className="text-sm font-bold text-[#EF4444]">
                  Cảnh báo an ninh đang hoạt động — Nhấn để xem
                </span>
              </div>
              <Badge className="bg-[#EF4444] text-white border-transparent text-xs animate-pulse">
                CẢNH BÁO CAO
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
              {activePanel === 'exception' && 'Tra cứu phiên đỗ và xử lý các tình huống: mất/hỏng thẻ, xuất bến khẩn cấp, khôi phục phiên thủ công.'}
              {activePanel === 'security' && 'Xem và xử lý cảnh báo biển số không khớp hoặc phương tiện trong danh sách đen.'}
              {activePanel === 'emergency' && 'Mở barrier nhanh cho các trường hợp khẩn cấp và theo dõi phiếu sự cố.'}
            </p>
          </div>

          {/* Panels */}
          {activePanel === 'exception' && <ExitException onToast={addToast} onBarrierChange={() => {}} />}
          {activePanel === 'security' && <SecurityAlertPanel onToast={addToast} onAlertResolved={() => setActiveAlertCount(0)} />}
          {activePanel === 'emergency' && <EmergencyBarrier onToast={addToast} onBarrierChange={() => {}} />}
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

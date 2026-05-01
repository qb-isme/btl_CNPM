'use client';

import { useState } from 'react';
import { ShieldAlert, CheckCircle2, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { securityAlerts, activeSessions, type SecurityAlert } from '@/lib/parking-data';

interface SecurityAlertPanelProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export default function SecurityAlertPanel({ onToast }: SecurityAlertPanelProps) {
  const [alerts, setAlerts] = useState<SecurityAlert[]>(securityAlerts.filter(a => !a.resolved));

  const resolveAlert = (alertId: string, action: 'confirm' | 'lock') => {
    setAlerts(prev => prev.filter(a => a.id !== alertId));
    if (action === 'confirm') {
      onToast('Ngoại lệ được xác nhận hợp lệ. Mở barrier.', 'success');
    } else {
      onToast('Đã khoá phiên & gửi báo cáo gian lận tới Ban an ninh.', 'error');
    }
  };

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-[#94A3B8] gap-3">
        <CheckCircle2 size={40} className="text-[#10B981]" />
        <p className="text-sm font-medium">Không có cảnh báo an ninh đang hoạt động.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {alerts.map(alert => {
        const session = activeSessions.find(s => s.id === alert.sessionId);
        return (
          <div
            key={alert.id}
            className="rounded-xl border-2 border-[#EF4444] bg-[#FEF2F2] p-4 flex flex-col gap-3"
          >
            {/* Alert Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert size={20} className="text-[#EF4444]" />
                <span className="font-bold text-[#EF4444] text-sm uppercase tracking-wide">
                  {alert.alertType === 'plate_mismatch' ? 'Biển số không khớp' : 'Phương tiện nằm trong danh sách đen'}
                </span>
              </div>
              <Badge className="bg-[#EF4444] text-white border-transparent text-xs animate-pulse">
                CẢNH BÁO CAO
              </Badge>
            </div>

            {/* Alert Details */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-[#64748B]">Biển số:</span>
                <span className="font-bold text-[#1E293B]">{alert.licensePlate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#64748B]">Phát hiện:</span>
                <span className="font-semibold">{alert.detectedAt.toLocaleTimeString('vi-VN')}</span>
              </div>
              {session && (
                <>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Chủ xe (hồ sơ):</span>
                    <span className="font-semibold">{session.ownerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Khu vực:</span>
                    <span className="font-semibold">{session.zone}</span>
                  </div>
                </>
              )}
            </div>

            <p className="text-xs text-[#64748B] bg-white/60 rounded-lg p-2 border border-[#EF4444]/20">
              {alert.notes}
            </p>

            {/* Photo comparison */}
            {session && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#64748B] font-medium">Ảnh check-in</span>
                  <img
                    src={session.checkInPhoto}
                    alt="Ảnh xe lúc vào"
                    className="w-full rounded-lg object-cover aspect-video bg-[#1E293B]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-[#64748B] font-medium">Camera hiện tại</span>
                  <div className="w-full rounded-lg aspect-video bg-[#1E293B] flex items-center justify-center">
                    <span className="text-[#94A3B8] text-xs">Live feed...</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-1">
              <Button
                className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white"
                onClick={() => resolveAlert(alert.id, 'confirm')}
              >
                <CheckCircle2 size={16} /> Xác nhận ngoại lệ hợp lệ
              </Button>
              <Button
                className="flex-1 bg-[#1E293B] hover:bg-[#0f172a] text-white"
                onClick={() => resolveAlert(alert.id, 'lock')}
              >
                <Lock size={16} /> Khoá phiên &amp; Báo cáo
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

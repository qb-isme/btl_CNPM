'use client';

import { useState } from 'react';
import { Search, Camera, CreditCard, AlertTriangle, User, RotateCcw, ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  activeSessions,
  calcParkingFee,
  formatVND,
  formatDuration,
  LOST_CARD_PENALTY,
  GUEST_LOST_CARD_PENALTY,
  ILLEGAL_EXIT_FINE,
  type ActiveSession,
} from '@/lib/parking-data';

interface ExitExceptionProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export default function ExitException({ onToast }: ExitExceptionProps) {
  const [searchPlate, setSearchPlate] = useState('');
  const [foundSession, setFoundSession] = useState<ActiveSession | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [cccdInput, setCccdInput] = useState('');
  const [activeTab, setActiveTab] = useState('normal');

  const handleSearch = () => {
    const q = searchPlate.trim().toUpperCase();
    if (!q) return;
    const session = activeSessions.find(s => s.licensePlate.toUpperCase() === q || s.licensePlate.toUpperCase().includes(q));
    if (session) {
      setFoundSession(session);
      setNotFound(false);
      // Auto-select the relevant tab based on card status
      if (session.cardStatus === 'damaged') setActiveTab('normal');
      else if (session.cardStatus === 'lost') setActiveTab('lost');
      else setActiveTab('normal');
    } else {
      setFoundSession(null);
      setNotFound(true);
    }
  };

  const parkingFee = foundSession ? calcParkingFee(foundSession.checkInTime) : 0;
  const lostPenalty = foundSession?.userType === 'guest' ? GUEST_LOST_CARD_PENALTY : LOST_CARD_PENALTY;

  const handleMarkDamaged = () => {
    if (!foundSession) return;
    onToast(`Thẻ ${foundSession.cardId} đã bị đánh dấu hỏng. Thu phí ${formatVND(parkingFee)}.`, 'success');
  };

  const handleCollectLostFee = () => {
    if (!foundSession) return;
    const total = parkingFee + lostPenalty;
    onToast(`Đã thu phí + phạt mất thẻ: ${formatVND(total)}. Mở barrier.`, 'success');
  };

  const handleLinkBKPay = () => {
    if (!foundSession) return;
    onToast(`Đã liên kết BKPay cho MSSV ${foundSession.studentId}. Tổng: ${formatVND(parkingFee + lostPenalty)}.`, 'success');
  };

  const handleManualRecovery = () => {
    if (!foundSession) return;
    onToast(`Đã tạo phiên mới (A3). Ghi nhận vào ra thủ công cho xe ${foundSession.licensePlate}.`, 'success');
  };

  const handleEmergencyExit = () => {
    if (!cccdInput.trim()) {
      onToast('Vui lòng nhập số CCCD.', 'error');
      return;
    }
    onToast(`Mở khẩn cho CCCD ${cccdInput}. Phạt ${formatVND(ILLEGAL_EXIT_FINE)}. Đã ghi cảnh báo an ninh cao.`, 'error');
    setCccdInput('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search Area */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#1E293B] flex items-center gap-2">
            <Search size={16} className="text-[#0284C7]" />
            UC 5.1 — Xử lý ngoại lệ ra cổng
          </CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Input
            placeholder="Nhập biển số xe (VD: 51A-12345)..."
            value={searchPlate}
            onChange={e => setSearchPlate(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="flex-1"
          />
          <Button onClick={handleSearch} className="bg-[#0284C7] hover:bg-[#0369A1] text-white">
            <Search size={16} />
            Tra cứu
          </Button>
        </CardContent>
      </Card>

      {notFound && !foundSession && (
        <Card className="border border-[#EF4444] bg-[#FEF2F2]">
          <CardContent className="pt-4">
            <p className="text-sm text-[#EF4444] font-medium flex items-center gap-2">
              <AlertTriangle size={16} /> Không tìm thấy phiên đang hoạt động cho biển số này.
            </p>
          </CardContent>
        </Card>
      )}

      {foundSession && (
        <>
          {/* Session Info */}
          <div className="grid grid-cols-2 gap-3">
            {/* Check-in Photo */}
            <Card className="border border-[#E2E8F0]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-[#64748B] uppercase flex items-center gap-1">
                  <Camera size={13} /> Ảnh check-in
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={foundSession.checkInPhoto}
                  alt="Ảnh check-in xe"
                  className="w-full rounded-lg object-cover aspect-video bg-[#1E293B]"
                />
              </CardContent>
            </Card>

            {/* Current Camera */}
            <Card className="border border-[#E2E8F0]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-[#64748B] uppercase flex items-center gap-1">
                  <Camera size={13} /> Camera hiện tại (live)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full rounded-lg aspect-video bg-[#1E293B] flex items-center justify-center">
                  <span className="text-[#94A3B8] text-xs">Camera đang phát...</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Vehicle Info */}
          <Card className="border border-[#0284C7] bg-[#F0F9FF]">
            <CardContent className="pt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Biển số:</span>
                <span className="font-bold text-[#0284C7]">{foundSession.licensePlate}</span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Chủ xe:</span>
                <span className="font-semibold">{foundSession.ownerName}</span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Loại:</span>
                <Badge
                  className={
                    foundSession.userType === 'student' ? 'bg-[#D1FAE5] text-[#10B981] border-[#10B981]/30' :
                    foundSession.userType === 'staff' ? 'bg-[#F0F9FF] text-[#0284C7] border-[#0284C7]/30' :
                    'bg-[#E2E8F0] text-[#64748B] border-[#64748B]/30'
                  }
                >
                  {foundSession.userType === 'student' ? 'Sinh viên' : foundSession.userType === 'staff' ? 'Cán bộ' : 'Khách'}
                </Badge>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">MSSV/CB:</span>
                <span className="font-semibold">{foundSession.studentId ?? '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Khu:</span>
                <span className="font-semibold">{foundSession.zone}</span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Thời gian:</span>
                <span className="font-semibold">{formatDuration(foundSession.checkInTime)}</span>
              </div>
              <div className="flex justify-between pb-1 col-span-2">
                <span className="text-[#64748B]">Phí gửi xe:</span>
                <span className="font-bold text-[#10B981] text-base">{formatVND(parkingFee)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Exception Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 h-auto p-1">
              <TabsTrigger value="normal" className="text-xs py-2">Thẻ bình thường / Hỏng (A1)</TabsTrigger>
              <TabsTrigger value="lost" className="text-xs py-2">Mất thẻ (A2)</TabsTrigger>
              <TabsTrigger value="error" className="text-xs py-2">Lỗi hệ thống (A3)</TabsTrigger>
              <TabsTrigger value="illegal" className="text-xs py-2">Không dữ liệu (A4)</TabsTrigger>
            </TabsList>

            {/* A1: Normal / Damaged */}
            <TabsContent value="normal">
              <Card className="border border-[#E2E8F0]">
                <CardContent className="pt-4 flex flex-col gap-3">
                  <p className="text-sm text-[#64748B]">
                    Thẻ có dấu hiệu hư hỏng. Đánh dấu thẻ để vô hiệu hoá ID và thu phí bình thường.
                  </p>
                  <div className="flex items-center justify-between bg-[#F8FAFC] rounded-lg p-3">
                    <span className="text-sm text-[#64748B]">Phí thu:</span>
                    <span className="font-bold text-[#10B981]">{formatVND(parkingFee)}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                      onClick={handleMarkDamaged}
                    >
                      <CreditCard size={16} /> Đánh dấu thẻ hỏng
                    </Button>
                    <Button
                      className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white"
                      onClick={() => onToast(`Đã thu phí ${formatVND(parkingFee)}. Mở barrier.`, 'success')}
                    >
                      Thu phí &amp; Mở cổng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* A2: Lost Card */}
            <TabsContent value="lost">
              <Card className="border border-[#E2E8F0]">
                <CardContent className="pt-4 flex flex-col gap-3">
                  <div className="bg-[#FEF2F2] rounded-lg p-3 text-sm text-[#EF4444] flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>Mất thẻ. Phạt thêm <strong>{formatVND(lostPenalty)}</strong> ({foundSession.userType === 'guest' ? 'Khách vãng lai' : 'SV/CB'}).</span>
                  </div>
                  <div className="flex items-center justify-between bg-[#F8FAFC] rounded-lg p-3">
                    <span className="text-sm text-[#64748B]">Tổng thu (phí + phạt):</span>
                    <span className="font-bold text-[#EF4444]">{formatVND(parkingFee + lostPenalty)}</span>
                  </div>

                  {foundSession.userType === 'guest' ? (
                    <Button
                      className="w-full bg-[#EF4444] hover:bg-red-700 text-white"
                      onClick={handleCollectLostFee}
                    >
                      Thu phí + Phạt mất thẻ &amp; Mở cổng
                    </Button>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <Label className="text-xs text-[#64748B]">Tìm theo MSSV/CB để liên kết BKPay:</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Nhập MSSV hoặc mã CB..."
                          value={studentSearch}
                          onChange={e => setStudentSearch(e.target.value)}
                          className="flex-1"
                        />
                        <Button
                          variant="outline"
                          className="border-[#0284C7] text-[#0284C7] hover:bg-[#F0F9FF]"
                          onClick={() => setStudentSearch(foundSession.studentId ?? '')}
                        >
                          <User size={16} />
                        </Button>
                      </div>
                      {studentSearch && (
                        <Button
                          className="w-full bg-[#0284C7] hover:bg-[#0369A1] text-white"
                          onClick={handleLinkBKPay}
                        >
                          Liên kết BKPay &amp; Thu phí
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* A3: System Error */}
            <TabsContent value="error">
              <Card className="border border-[#E2E8F0]">
                <CardContent className="pt-4 flex flex-col gap-3">
                  <p className="text-sm text-[#64748B]">
                    Lỗi hệ thống — không đọc được thẻ hoặc dữ liệu phiên bị lỗi. Tạo phiên phục hồi thủ công.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    Hành động này sẽ tạo một phiên mới với thời gian vào = hiện tại và ghi log sự cố.
                  </div>
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={handleManualRecovery}
                  >
                    <RotateCcw size={16} /> Phục hồi thủ công (A3)
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* A4: Illegal / No Data */}
            <TabsContent value="illegal">
              <Card className="border border-[#EF4444] bg-[#FEF2F2]">
                <CardContent className="pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#EF4444] font-bold">
                    <ShieldX size={18} /> Không có dữ liệu — Xe có thể xâm nhập trái phép
                  </div>
                  <p className="text-sm text-[#64748B]">
                    Nhập CCCD và chụp ảnh chân dung. Phạt <strong>{formatVND(ILLEGAL_EXIT_FINE)}</strong> và ghi cảnh báo an ninh cao.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">Số CCCD *</Label>
                    <Input
                      placeholder="Nhập số CCCD (12 chữ số)..."
                      value={cccdInput}
                      onChange={e => setCccdInput(e.target.value)}
                      maxLength={12}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-xs">Ảnh chân dung</Label>
                    <div className="border-2 border-dashed border-[#EF4444]/40 rounded-lg h-24 flex items-center justify-center text-[#EF4444]/60 text-sm cursor-pointer hover:bg-[#EF4444]/5">
                      <Camera size={20} className="mr-2" /> Chụp / Tải ảnh lên
                    </div>
                  </div>
                  <Button
                    className="w-full bg-[#EF4444] hover:bg-red-700 text-white"
                    onClick={handleEmergencyExit}
                  >
                    <ShieldX size={16} /> Mở khẩn cấp + Ghi cảnh báo
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

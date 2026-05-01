'use client';

import { useState } from 'react';
import {
  Search, Camera, CreditCard, AlertTriangle, User,
  RotateCcw, ShieldX, CheckCircle2, Clock, ArrowLeft,
} from 'lucide-react';
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
  lookupPerson,
  type ActiveSession,
  type PersonRecord,
} from '@/lib/parking-data';

interface ExitExceptionProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

// Danh sách phiên đang hoạt động (có thể bị xoá sau khi đóng)
let sessionPool = [...activeSessions];

function MssvLookup({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const found: PersonRecord | null = value.trim() ? lookupPerson(value) : null;
  const hasInput = value.trim().length > 0;

  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-[#64748B]">MSSV / Mã giảng viên (tuỳ chọn)</Label>
      <Input
        placeholder="Nhập MSSV hoặc mã GV để tra cứu..."
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {hasInput && (
        found ? (
          <div className="flex items-center gap-3 bg-[#F0F9FF] border border-[#0284C7]/30 rounded-lg px-3 py-2 mt-1">
            <img
              src={found.avatarUrl}
              alt={found.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <div>
              <p className="text-sm font-semibold text-[#1E293B]">{found.name}</p>
              <p className="text-xs text-[#64748B]">
                {found.type === 'student' ? 'Sinh viên' : 'Cán bộ'} · {found.faculty}
              </p>
            </div>
            <CheckCircle2 size={16} className="text-[#10B981] ml-auto shrink-0" />
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-[#FFF7ED] border border-amber-300 rounded-lg px-3 py-2 mt-1">
            <AlertTriangle size={14} className="text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700">Không tìm thấy thông tin SV / GV với mã này.</p>
          </div>
        )
      )}
    </div>
  );
}

export default function ExitException({ onToast }: ExitExceptionProps) {
  const [searchPlate, setSearchPlate] = useState('');
  const [matchedSessions, setMatchedSessions] = useState<ActiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [closedSessionId, setClosedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('damaged');

  // Per-tab MSSV fields
  const [mssvDamaged, setMssvDamaged] = useState('');
  const [mssvLost, setMssvLost] = useState('');
  const [mssvError, setMssvError] = useState('');
  const [cccdInput, setCccdInput] = useState('');

  const handleSearch = () => {
    const q = searchPlate.trim().toUpperCase();
    if (!q) return;
    setClosedSessionId(null);
    const results = sessionPool.filter(s => s.licensePlate.toUpperCase().includes(q));
    if (results.length > 0) {
      setMatchedSessions(results);
      setSelectedSession(null);
      setNotFound(false);
    } else {
      setMatchedSessions([]);
      setSelectedSession(null);
      setNotFound(true);
    }
  };

  const handleSelectSession = (session: ActiveSession) => {
    setSelectedSession(session);
    setMssvDamaged(session.studentId ?? '');
    setMssvLost(session.studentId ?? '');
    setMssvError(session.studentId ?? '');
    setCccdInput('');
    if (session.cardStatus === 'lost') setActiveTab('lost');
    else if (session.cardStatus === 'damaged') setActiveTab('damaged');
    else setActiveTab('damaged');
  };

  // Đóng phiên: xoá khỏi pool, quay về màn tìm kiếm, hiển thị thông báo không còn phiên
  const handleCloseSession = (sessionId: string, toastMsg: string, toastType: 'success' | 'error') => {
    sessionPool = sessionPool.filter(s => s.id !== sessionId);
    setClosedSessionId(sessionId);
    setSelectedSession(null);
    setMatchedSessions(prev => prev.filter(s => s.id !== sessionId));
    onToast(toastMsg, toastType);
  };

  const parkingFee = selectedSession ? calcParkingFee(selectedSession.checkInTime) : 0;
  const lostPenalty = selectedSession?.userType === 'guest' ? GUEST_LOST_CARD_PENALTY : LOST_CARD_PENALTY;

  const userTypeLabel = (s: ActiveSession) =>
    s.userType === 'student' ? 'Sinh viên' : s.userType === 'staff' ? 'Cán bộ' : 'Khách';

  const cardStatusStyle = (s: ActiveSession) => {
    if (s.cardStatus === 'ok') return 'bg-[#D1FAE5] text-[#059669] border-[#059669]/20';
    if (s.cardStatus === 'damaged') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (s.cardStatus === 'lost') return 'bg-[#FEE2E2] text-[#EF4444] border-[#EF4444]/20';
    return 'bg-[#E2E8F0] text-[#64748B] border-[#94A3B8]/20';
  };
  const cardStatusLabel = (s: ActiveSession) => {
    if (s.cardStatus === 'ok') return 'Thẻ OK';
    if (s.cardStatus === 'damaged') return 'Thẻ hỏng';
    if (s.cardStatus === 'lost') return 'Mất thẻ';
    return 'Không thẻ';
  };

  // Xác định có còn phiên nào sau khi đóng không
  const remainingAfterClose = matchedSessions.filter(s => s.id !== closedSessionId);

  return (
    <div className="flex flex-col gap-4">
      {/* BƯỚC 1: Tìm kiếm */}
      <Card className="border border-[#E2E8F0]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold text-[#1E293B] flex items-center gap-2">
            <Search size={16} className="text-[#0284C7]" />
            Tra cứu biển số xe
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

      {/* Không tìm thấy */}
      {notFound && (
        <Card className="border border-[#EF4444] bg-[#FEF2F2]">
          <CardContent className="pt-4">
            <p className="text-sm text-[#EF4444] font-medium flex items-center gap-2">
              <AlertTriangle size={16} /> Không tìm thấy phiên đang hoạt động cho biển số này.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Vừa đóng phiên — không còn phiên nào */}
      {closedSessionId && remainingAfterClose.length === 0 && (
        <Card className="border border-[#10B981] bg-[#F0FDF4]">
          <CardContent className="pt-4">
            <p className="text-sm text-[#059669] font-medium flex items-center gap-2">
              <CheckCircle2 size={16} /> Phiên đã được đóng. Không còn phiên nào đang hoạt động.
            </p>
          </CardContent>
        </Card>
      )}

      {/* BƯỚC 2: Danh sách phiên tóm gọn */}
      {matchedSessions.filter(s => s.id !== closedSessionId).length > 0 && !selectedSession && (
        <Card className="border border-[#E2E8F0]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#64748B] uppercase tracking-wide">
              Phiên đang hoạt động ({matchedSessions.filter(s => s.id !== closedSessionId).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-0">
            {matchedSessions
              .filter(s => s.id !== closedSessionId)
              .map(session => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className="w-full text-left rounded-xl border border-[#E2E8F0] hover:border-[#0284C7] hover:bg-[#F0F9FF] transition-all p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${session.status === 'flagged' ? 'bg-[#FEE2E2]' : 'bg-[#D1FAE5]'}`}>
                      {session.status === 'flagged'
                        ? <AlertTriangle size={15} className="text-[#EF4444]" />
                        : <CheckCircle2 size={15} className="text-[#059669]" />}
                    </div>
                    <div>
                      <p className="font-bold text-[#1E293B] text-sm">{session.licensePlate}</p>
                      <p className="text-xs text-[#64748B]">
                        {session.ownerName || 'Khách vãng lai'} · {userTypeLabel(session)} · {session.zone}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-[#64748B] flex items-center gap-1 justify-end">
                        <Clock size={11} /> {formatDuration(session.checkInTime)}
                      </p>
                      <p className="text-xs font-semibold text-[#10B981]">{formatVND(calcParkingFee(session.checkInTime))}</p>
                    </div>
                    <Badge className={`text-xs border ${cardStatusStyle(session)}`}>
                      {cardStatusLabel(session)}
                    </Badge>
                    {session.status === 'flagged' && (
                      <Badge className="bg-[#FEE2E2] text-[#EF4444] border-[#EF4444]/20 text-xs">
                        Cảnh báo
                      </Badge>
                    )}
                  </div>
                </button>
              ))}
          </CardContent>
        </Card>
      )}

      {/* BƯỚC 3: Chi tiết phiên + xử lý */}
      {selectedSession && (
        <>
          <button
            onClick={() => setSelectedSession(null)}
            className="text-sm text-[#0284C7] hover:underline flex items-center gap-1 w-fit"
          >
            <ArrowLeft size={14} /> Quay lại danh sách phiên
          </button>

          {/* Ảnh so sánh */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="border border-[#E2E8F0]">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold text-[#64748B] uppercase flex items-center gap-1">
                  <Camera size={13} /> Ảnh check-in
                </CardTitle>
              </CardHeader>
              <CardContent>
                <img
                  src={selectedSession.checkInPhoto}
                  alt="Ảnh check-in xe"
                  className="w-full rounded-lg object-cover aspect-video bg-[#1E293B]"
                />
              </CardContent>
            </Card>
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

          {/* Thông tin phiên chi tiết */}
          <Card className="border border-[#0284C7] bg-[#F0F9FF]">
            <CardContent className="pt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Biển số:</span>
                <span className="font-bold text-[#0284C7]">{selectedSession.licensePlate}</span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Chủ xe:</span>
                <span className="font-semibold">
                  {selectedSession.ownerName || <span className="text-[#94A3B8] italic">—</span>}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Loại:</span>
                <Badge
                  className={
                    selectedSession.userType === 'student'
                      ? 'bg-[#D1FAE5] text-[#10B981] border-[#10B981]/30'
                      : selectedSession.userType === 'staff'
                      ? 'bg-[#F0F9FF] text-[#0284C7] border-[#0284C7]/30'
                      : 'bg-[#E2E8F0] text-[#64748B] border-[#64748B]/30'
                  }
                >
                  {userTypeLabel(selectedSession)}
                </Badge>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">MSSV/CB:</span>
                <span className="font-semibold">{selectedSession.studentId ?? '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Mã thẻ:</span>
                <span className="font-semibold font-mono">{selectedSession.cardId ?? '—'}</span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Khu:</span>
                <span className="font-semibold">{selectedSession.zone}</span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Thời gian gửi:</span>
                <span className="font-semibold">{formatDuration(selectedSession.checkInTime)}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-[#64748B]">Phí gửi xe:</span>
                <span className="font-bold text-[#10B981] text-base">{formatVND(parkingFee)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tabs xử lý */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 h-auto p-1">
              <TabsTrigger value="damaged" className="text-xs py-2">Hỏng thẻ</TabsTrigger>
              <TabsTrigger value="lost" className="text-xs py-2">Mất thẻ</TabsTrigger>
              <TabsTrigger value="error" className="text-xs py-2">Lỗi hệ thống</TabsTrigger>
              <TabsTrigger value="nodata" className="text-xs py-2">Không dữ liệu</TabsTrigger>
            </TabsList>

            {/* Tab: Hỏng thẻ */}
            <TabsContent value="damaged">
              <Card className="border border-[#E2E8F0]">
                <CardContent className="pt-4 flex flex-col gap-3">
                  <p className="text-sm text-[#64748B]">
                    Thẻ có dấu hiệu hư hỏng. Đánh dấu thẻ để vô hiệu hóa ID và thu phí bình thường.
                  </p>
                  <div className="flex items-center justify-between bg-[#F8FAFC] rounded-lg p-3">
                    <span className="text-sm text-[#64748B]">Phí thu:</span>
                    <span className="font-bold text-[#10B981]">{formatVND(parkingFee)}</span>
                  </div>
                  <MssvLookup value={mssvDamaged} onChange={setMssvDamaged} />
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2]"
                      onClick={() =>
                        onToast(`Thẻ ${selectedSession.cardId ?? '—'} đã bị đánh dấu hỏng.`, 'success')
                      }
                    >
                      <CreditCard size={16} /> Đánh dấu thẻ hỏng
                    </Button>
                    <Button
                      className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white"
                      onClick={() =>
                        handleCloseSession(
                          selectedSession.id,
                          `Đã thu phí ${formatVND(parkingFee)}. Mở barrier.`,
                          'success',
                        )
                      }
                    >
                      Thu phí &amp; Mở cổng
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Mất thẻ */}
            <TabsContent value="lost">
              <Card className="border border-[#E2E8F0]">
                <CardContent className="pt-4 flex flex-col gap-3">
                  <div className="bg-[#FEF2F2] rounded-lg p-3 text-sm text-[#EF4444] flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>
                      Mất thẻ. Phạt thêm <strong>{formatVND(lostPenalty)}</strong>{' '}
                      ({selectedSession.userType === 'guest' ? 'Khách vãng lai' : 'SV/CB'}).
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#F8FAFC] rounded-lg p-3">
                    <span className="text-sm text-[#64748B]">Tổng thu (phí + phạt):</span>
                    <span className="font-bold text-[#EF4444]">{formatVND(parkingFee + lostPenalty)}</span>
                  </div>
                  <MssvLookup value={mssvLost} onChange={setMssvLost} />
                  <Button
                    className="w-full bg-[#EF4444] hover:bg-red-700 text-white"
                    onClick={() =>
                      handleCloseSession(
                        selectedSession.id,
                        `Đã thu phí + phạt mất thẻ: ${formatVND(parkingFee + lostPenalty)}. Mở barrier.`,
                        'success',
                      )
                    }
                  >
                    Thu phí &amp; Mở cổng
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Lỗi hệ thống */}
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
                  <MssvLookup value={mssvError} onChange={setMssvError} />
                  <Button
                    className="w-full bg-amber-500 hover:bg-amber-600 text-white"
                    onClick={() =>
                      handleCloseSession(
                        selectedSession.id,
                        `Đã tạo phiên phục hồi thủ công cho xe ${selectedSession.licensePlate}.`,
                        'success',
                      )
                    }
                  >
                    <RotateCcw size={16} /> Phục hồi thủ công
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Không dữ liệu */}
            <TabsContent value="nodata">
              <Card className="border border-[#EF4444] bg-[#FEF2F2]">
                <CardContent className="pt-4 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-[#EF4444] font-bold">
                    <ShieldX size={18} /> Không có dữ liệu — Xe có thể xâm nhập trái phép
                  </div>
                  <p className="text-sm text-[#64748B]">
                    Nhập CCCD và chụp ảnh chân dung. Phạt <strong>{formatVND(ILLEGAL_EXIT_FINE)}</strong> và ghi cảnh báo an ninh.
                  </p>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Số CCCD *</Label>
                    <Input
                      placeholder="Nhập số CCCD (12 chữ số)..."
                      value={cccdInput}
                      onChange={e => setCccdInput(e.target.value)}
                      maxLength={12}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs">Ảnh chân dung</Label>
                    <div className="border-2 border-dashed border-[#EF4444]/40 rounded-lg h-24 flex items-center justify-center text-[#EF4444]/60 text-sm cursor-pointer hover:bg-[#EF4444]/5">
                      <Camera size={20} className="mr-2" /> Chụp / Tải ảnh lên
                    </div>
                  </div>
                  <Button
                    className="w-full bg-[#EF4444] hover:bg-red-700 text-white"
                    onClick={() => {
                      if (!cccdInput.trim()) {
                        onToast('Vui lòng nhập số CCCD.', 'error');
                        return;
                      }
                      handleCloseSession(
                        selectedSession.id,
                        `Mở khẩn cho CCCD ${cccdInput}. Phạt ${formatVND(ILLEGAL_EXIT_FINE)}. Đã ghi cảnh báo.`,
                        'error',
                      );
                      setCccdInput('');
                    }}
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

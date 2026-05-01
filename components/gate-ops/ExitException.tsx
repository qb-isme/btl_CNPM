'use client';

import { useState, useRef } from 'react';
import {
  Search, Camera, CreditCard, AlertTriangle, User,
  CheckCircle2, Clock, ArrowLeft, Siren, RefreshCw, Upload, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  activeSessions,
  calcParkingFee,
  formatVND,
  formatDuration,
  LOST_CARD_PENALTY,
  GUEST_LOST_CARD_PENALTY,
  type ActiveSession,
} from '@/lib/parking-data';

interface ExitExceptionProps {
  onToast: (message: string, type: 'success' | 'error') => void;
  onBarrierChange: (open: boolean) => void;
}

// Danh sách phiên đang hoạt động (có thể bị xoá sau khi đóng)
let sessionPool = [...activeSessions];

// Bảng tra cứu nội bộ theo studentId — lấy từ dữ liệu phiên
const personMap: Record<string, { name: string; type: 'student' | 'staff'; faculty: string; avatarUrl: string }> = {
  'B20DCCN001': {
    name: 'Trần Văn Bình',
    type: 'student',
    faculty: 'CNTT',
    avatarUrl: 'https://placehold.co/80x80/0284C7/ffffff?text=TVB',
  },
  'B21DCCN099': {
    name: 'Nguyễn Minh Đức',
    type: 'student',
    faculty: 'CNTT',
    avatarUrl: 'https://placehold.co/80x80/0284C7/ffffff?text=NMD',
  },
  'CB00042': {
    name: 'Lê Thị Hương',
    type: 'staff',
    faculty: 'Phòng Đào tạo',
    avatarUrl: 'https://placehold.co/80x80/475569/ffffff?text=LTH',
  },
};

/** Hiển thị thông tin SV/CB tự động từ studentId của phiên (chỉ với student/staff) */
function PersonInfo({ session }: { session: ActiveSession }) {
  if (session.userType === 'guest') return null;

  const sid = session.studentId;
  const person = sid ? personMap[sid] : null;

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-[#64748B] font-medium uppercase tracking-wide">
        Thông tin {session.userType === 'student' ? 'Sinh viên' : 'Cán bộ'}
      </span>
      {person ? (
        <div className="flex items-center gap-3 bg-[#F0F9FF] border border-[#0284C7]/30 rounded-lg px-3 py-2">
          <img
            src={person.avatarUrl}
            alt={person.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <p className="text-sm font-semibold text-[#1E293B]">{person.name}</p>
            <p className="text-xs text-[#64748B]">
              {person.type === 'student' ? 'Sinh viên' : 'Cán bộ'} · {person.faculty}
            </p>
            <p className="text-xs font-mono text-[#0284C7]">{sid}</p>
          </div>
          <CheckCircle2 size={16} className="text-[#10B981] ml-auto shrink-0" />
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2">
          <User size={14} className="text-[#94A3B8] shrink-0" />
          <p className="text-xs text-[#94A3B8]">
            {sid ? `Mã ${sid} — không tìm thấy trong hệ thống` : 'Không có mã định danh'}
          </p>
        </div>
      )}
    </div>
  );
}

export default function ExitException({ onToast, onBarrierChange }: ExitExceptionProps) {
  const [searchPlate, setSearchPlate] = useState('');
  const [matchedSessions, setMatchedSessions] = useState<ActiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [closedSessionId, setClosedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('damaged');

  // State cho dialog xuất bến khẩn cấp
  const [showEmergencyExitDialog, setShowEmergencyExitDialog] = useState(false);
  const [emergencyCccd, setEmergencyCccd] = useState('');
  const [emergencyPortrait, setEmergencyPortrait] = useState<string | null>(null);
  const portraitInputRef = useRef<HTMLInputElement>(null);

  // State cho dialog khôi phục phiên thủ công
  const [showRecoveryDialog, setShowRecoveryDialog] = useState(false);
  const [recoveryCardId, setRecoveryCardId] = useState('');
  const [recoveryCardScanned, setRecoveryCardScanned] = useState(false);
  // Thông tin tự động từ thẻ
  const [recoveryCardInfo, setRecoveryCardInfo] = useState<{
    cardId: string;
    ownerName: string;
    userType: 'student' | 'staff' | 'guest';
    studentId?: string;
    faculty?: string;
    checkInTime?: string;
    zone?: string;
  } | null>(null);

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
    // Mặc định tab "Hỏng thẻ" - nhân viên bảo vệ sẽ quyết định
    setActiveTab('damaged');
  };

  // Đóng phiên: xoá khỏi pool, quay về danh sách, hiện banner xanh, báo mở barrier
  const handleCloseSession = (sessionId: string, toastMsg: string, toastType: 'success' | 'error') => {
    sessionPool = sessionPool.filter(s => s.id !== sessionId);
    setClosedSessionId(sessionId);
    setSelectedSession(null);
    setMatchedSessions(prev => prev.filter(s => s.id !== sessionId));
    onToast(toastMsg, toastType);
    onBarrierChange(true);
  };

  const parkingFee = selectedSession ? calcParkingFee(selectedSession.checkInTime) : 0;
  const lostPenalty = selectedSession?.userType === 'guest' ? GUEST_LOST_CARD_PENALTY : LOST_CARD_PENALTY;

  const userTypeLabel = (s: ActiveSession) =>
    s.userType === 'student' ? 'Sinh viên' : s.userType === 'staff' ? 'Cán bộ' : 'Khách';

  // Chỉ hiển thị "Đang gửi" - trạng thái thẻ do nhân viên bảo vệ quyết định khi xử lý
  const cardStatusStyle = () => {
    return 'bg-[#D1FAE5] text-[#059669] border-[#059669]/20';
  };
  const cardStatusLabel = () => {
    return 'Đang gửi';
  };

  const remainingAfterClose = matchedSessions.filter(s => s.id !== closedSessionId);

  // Xử lý upload ảnh
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    setImage: (url: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  // Xử lý xuất bến khẩn cấp
  const handleEmergencyExit = () => {
    if (!emergencyCccd.trim()) {
      onToast('Vui lòng nhập số CCCD.', 'error');
      return;
    }
    if (!emergencyPortrait) {
      onToast('Vui lòng chụp ảnh chân dung.', 'error');
      return;
    }
    // Ảnh xe được chụp tự động từ camera
    // Đóng dialog và thông báo thành công
    setShowEmergencyExitDialog(false);
    setEmergencyCccd('');
    setEmergencyPortrait(null);
    onToast(`Đã xuất bến khẩn cấp cho xe ${searchPlate || 'không xác định'}. CCCD: ${emergencyCccd}.`, 'success');
    onBarrierChange(true);
  };

  // Giả lập quét thẻ - trong thực tế sẽ gọi API đọc thẻ
  const handleScanCard = () => {
    // Giả lập quét thẻ và lấy thông tin (bao gồm thời gian vào và khu gửi từ thẻ)
    const mockCardData = {
      cardId: 'CARD-0099',
      ownerName: 'Nguyễn Văn An',
      userType: 'student' as const,
      studentId: 'B21DCCN045',
      faculty: 'CNTT',
      checkInTime: '1 giờ trước',
      zone: 'Khu B',
    };
    setRecoveryCardId(mockCardData.cardId);
    setRecoveryCardInfo(mockCardData);
    setRecoveryCardScanned(true);
    onToast('Đã quét thẻ thành công!', 'success');
  };

  // Xử lý khôi phục phiên thủ công
  const handleManualRecovery = () => {
    if (!recoveryCardScanned || !recoveryCardInfo) {
      onToast('Vui lòng quét thẻ trước.', 'error');
      return;
    }
    // Đóng dialog và thông báo thành công
    setShowRecoveryDialog(false);
    setRecoveryCardId('');
    setRecoveryCardScanned(false);
    setRecoveryCardInfo(null);
    onToast(`Đã tạo phiên khôi phục thủ công cho thẻ ${recoveryCardInfo.cardId}, chủ xe ${recoveryCardInfo.ownerName}.`, 'success');
    onBarrierChange(true);
  };

  // Reset khi đóng dialog khôi phục
  const handleCloseRecoveryDialog = (open: boolean) => {
    setShowRecoveryDialog(open);
    if (!open) {
      setRecoveryCardId('');
      setRecoveryCardScanned(false);
      setRecoveryCardInfo(null);
    }
  };

  // Kiểm tra có nên hiện nút khẩn cấp không
  // Hiện khi: chưa nhập gì, hoặc nhập sai (notFound), hoặc không có session được chọn
  const shouldShowEmergencyButtons = !selectedSession && (searchPlate.trim() === '' || notFound || matchedSessions.length === 0);

  return (
    <div className="flex flex-col gap-4">
      {/* BUOC 1: Tim kiem */}
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

      {/* Khong tim thay */}
      {notFound && (
        <Card className="border border-[#EF4444] bg-[#FEF2F2]">
          <CardContent className="pt-4">
            <p className="text-sm text-[#EF4444] font-medium flex items-center gap-2">
              <AlertTriangle size={16} /> Không tìm thấy phiên đang hoạt động cho biển số này.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Nút xử lý khẩn cấp - hiện khi chưa tìm thấy phiên hoặc không có kết quả */}
      {shouldShowEmergencyButtons && (
        <Card className="border border-amber-300 bg-amber-50">
          <CardContent className="pt-4 flex flex-col gap-3">
            <p className="text-sm text-amber-700 font-medium">
              Không tìm thấy phiên? Sử dụng một trong các tùy chọn dưới đây:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nút Xuất bến khẩn cấp */}
              <Button
                variant="outline"
                className="border-[#EF4444] text-[#EF4444] hover:bg-[#FEF2F2] flex items-center gap-2 h-auto py-3"
                onClick={() => setShowEmergencyExitDialog(true)}
              >
                <Siren size={18} />
                <div className="text-left">
                  <p className="font-semibold">Xuất bến khẩn cấp</p>
                  <p className="text-xs font-normal opacity-80">Xe không có phiên trong hệ thống</p>
                </div>
              </Button>

              {/* Nút Khôi phục phiên thủ công */}
              <Button
                variant="outline"
                className="border-amber-500 text-amber-700 hover:bg-amber-100 flex items-center gap-2 h-auto py-3"
                onClick={() => setShowRecoveryDialog(true)}
              >
                <RefreshCw size={18} />
                <div className="text-left">
                  <p className="font-semibold">Khôi phục phiên thủ công</p>
                  <p className="text-xs font-normal opacity-80">Có thẻ nhưng không tìm thấy phiên</p>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vua dong phien — khong con phien nao */}
      {closedSessionId && remainingAfterClose.length === 0 && (
        <Card className="border border-[#10B981] bg-[#F0FDF4]">
          <CardContent className="pt-4">
            <p className="text-sm text-[#059669] font-medium flex items-center gap-2">
              <CheckCircle2 size={16} /> Phiên đã được đóng. Không còn phiên nào đang hoạt động.
            </p>
          </CardContent>
        </Card>
      )}

      {/* BUOC 2: Danh sach phien tom gon */}
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

      {/* BUOC 3: Chi tiet phien + xu ly */}
      {selectedSession && (
        <>
          <button
            onClick={() => setSelectedSession(null)}
            className="text-sm text-[#0284C7] hover:underline flex items-center gap-1 w-fit"
          >
            <ArrowLeft size={14} /> Quay lại danh sách phiên
          </button>

          {/* Anh so sanh */}
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
                  alt="Anh check-in xe"
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

          {/* Thong tin phien chi tiet */}
          <Card className="border border-[#0284C7] bg-[#F0F9FF]">
            <CardContent className="pt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Biển số:</span>
                <span className="font-bold text-[#0284C7]">{selectedSession.licensePlate}</span>
              </div>
              <div className="flex justify-between border-b border-[#0284C7]/20 pb-1">
                <span className="text-[#64748B]">Chủ xe:</span>
                <span className="font-semibold">
                  {selectedSession.ownerName || <span className="text-[#94A3B8] italic">Khách vãng lai</span>}
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

          {/* Tabs xu ly - chỉ còn 2 tab: Hỏng thẻ và Mất thẻ */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2 h-auto p-1">
              <TabsTrigger value="damaged" className="text-xs py-2">Hỏng thẻ</TabsTrigger>
              <TabsTrigger value="lost" className="text-xs py-2">Mất thẻ</TabsTrigger>
            </TabsList>

            {/* Tab: Hong the */}
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
                  <PersonInfo session={selectedSession} />
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

            {/* Tab: Mat the */}
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
                  <PersonInfo session={selectedSession} />
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

          </Tabs>
        </>
      )}

      {/* Dialog Xuất bến khẩn cấp */}
      <Dialog open={showEmergencyExitDialog} onOpenChange={setShowEmergencyExitDialog}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#EF4444]">
              <Siren size={20} />
              Xuất bến khẩn cấp
            </DialogTitle>
            <DialogDescription>
              Dành cho xe không có phiên trong hệ thống. Yêu cầu CCCD và ảnh chân dung người gửi xe.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            {/* Ảnh xe tại cổng - tự động từ camera */}
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                Ảnh xe tại cổng (tự động)
              </label>
              <div className="w-full h-32 rounded-lg bg-[#1E293B] flex items-center justify-center border border-[#E2E8F0] relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[#94A3B8] text-xs">Camera đang phát...</span>
                </div>
                <div className="absolute bottom-2 right-2 bg-[#10B981] text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                  <Camera size={10} /> Live
                </div>
              </div>
              <p className="text-xs text-[#64748B] mt-1">Hình ảnh sẽ được chụp tự động khi xác nhận</p>
            </div>

            {/* Số CCCD */}
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                Số CCCD / CMND <span className="text-[#EF4444]">*</span>
              </label>
              <Input
                placeholder="Nhập số CCCD của chủ xe..."
                value={emergencyCccd}
                onChange={e => setEmergencyCccd(e.target.value)}
                className="bg-white"
              />
            </div>

            {/* Upload ảnh chân dung */}
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                Ảnh chân dung người gửi xe <span className="text-[#EF4444]">*</span>
              </label>
              <input
                type="file"
                accept="image/*"
                capture="user"
                ref={portraitInputRef}
                className="hidden"
                onChange={e => handleImageUpload(e, setEmergencyPortrait)}
              />
              {emergencyPortrait ? (
                <div className="relative">
                  <img
                    src={emergencyPortrait}
                    alt="Ảnh chân dung"
                    className="w-full h-40 object-cover rounded-lg border border-[#E2E8F0]"
                  />
                  <button
                    className="absolute top-2 right-2 bg-[#EF4444] text-white p-1 rounded-full hover:bg-red-600"
                    onClick={() => setEmergencyPortrait(null)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  className="w-full h-24 border-dashed border-[#94A3B8] text-[#64748B] hover:bg-[#F8FAFC] bg-white"
                  onClick={() => portraitInputRef.current?.click()}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Upload size={20} />
                    <span className="text-xs">Chụp / Tải lên ảnh chân dung</span>
                  </div>
                </Button>
              )}
            </div>

            {/* Nút xác nhận */}
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                className="flex-1 bg-white"
                onClick={() => setShowEmergencyExitDialog(false)}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-[#EF4444] hover:bg-red-600 text-white"
                onClick={handleEmergencyExit}
              >
                <Siren size={16} />
                Xuất bến khẩn cấp
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Khôi phục phiên thủ công */}
      <Dialog open={showRecoveryDialog} onOpenChange={handleCloseRecoveryDialog}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <RefreshCw size={20} />
              Khôi phục phiên thủ công
            </DialogTitle>
            <DialogDescription>
              Dành cho trường hợp có thẻ nhưng không tìm thấy phiên trong hệ thống (lỗi hệ thống).
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 mt-2">
            {/* Quét thẻ */}
            <div>
              <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                Quét thẻ xe <span className="text-[#EF4444]">*</span>
              </label>
              {!recoveryCardScanned ? (
                <Button
                  variant="outline"
                  className="w-full h-16 border-dashed border-amber-400 text-amber-700 hover:bg-amber-50 bg-white"
                  onClick={handleScanCard}
                >
                  <div className="flex items-center gap-2">
                    <CreditCard size={20} />
                    <span>Nhấn để quét thẻ xe</span>
                  </div>
                </Button>
              ) : (
                <div className="flex items-center gap-3 bg-[#D1FAE5] border border-[#10B981]/30 rounded-lg px-3 py-2">
                  <CreditCard size={20} className="text-[#10B981]" />
                  <div>
                    <p className="text-sm font-semibold text-[#1E293B]">Mã thẻ: {recoveryCardId}</p>
                    <p className="text-xs text-[#10B981]">Đã quét thành công</p>
                  </div>
                  <CheckCircle2 size={16} className="text-[#10B981] ml-auto" />
                </div>
              )}
            </div>

            {/* Thông tin từ thẻ - hiện sau khi quét */}
            {recoveryCardScanned && recoveryCardInfo && (
              <>
                {/* Thông tin chủ xe */}
                <div className="bg-[#F0F9FF] border border-[#0284C7]/30 rounded-lg p-3">
                  <p className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-2">
                    Thông tin từ thẻ
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="flex gap-2">
                      <span className="text-[#64748B]">Chủ xe:</span>
                      <span className="font-semibold text-[#1E293B]">{recoveryCardInfo.ownerName}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-[#64748B]">Loại:</span>
                      <span className="font-semibold text-[#0284C7]">
                        {recoveryCardInfo.userType === 'student' ? 'Sinh viên' : recoveryCardInfo.userType === 'staff' ? 'Cán bộ' : 'Khách'}
                      </span>
                    </div>
                    {recoveryCardInfo.studentId && (
                      <div className="flex gap-2">
                        <span className="text-[#64748B]">MSSV/Mã CB:</span>
                        <span className="font-mono text-[#1E293B]">{recoveryCardInfo.studentId}</span>
                      </div>
                    )}
                    {recoveryCardInfo.faculty && (
                      <div className="flex gap-2">
                        <span className="text-[#64748B]">Khoa/Phòng:</span>
                        <span className="text-[#1E293B]">{recoveryCardInfo.faculty}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Ảnh xe tại cổng - tự động từ camera */}
                <div>
                  <label className="text-sm font-medium text-[#1E293B] block mb-1.5">
                    Ảnh xe tại cổng (tự động)
                  </label>
                  <div className="w-full h-32 rounded-lg bg-[#1E293B] flex items-center justify-center border border-[#E2E8F0] relative overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[#94A3B8] text-xs">Camera đang phát...</span>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-[#10B981] text-white text-xs px-2 py-0.5 rounded flex items-center gap-1">
                      <Camera size={10} /> Live
                    </div>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">Hình ảnh sẽ được chụp tự động khi xác nhận</p>
                </div>

                {/* Thông tin phiên khôi phục - lấy từ thẻ */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-700 uppercase tracking-wide mb-2">
                    Thông tin phiên khôi phục (từ thẻ)
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                    <div className="flex gap-2">
                      <span className="text-amber-600">Thời gian vào:</span>
                      <span className="font-semibold text-amber-800">{recoveryCardInfo.checkInTime || '1 giờ trước'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-amber-600">Khu gửi:</span>
                      <span className="font-semibold text-amber-800">{recoveryCardInfo.zone || 'Khu B'}</span>
                    </div>
                    <div className="flex gap-2 col-span-2">
                      <span className="text-amber-600">Ghi chú:</span>
                      <span className="font-semibold text-amber-800">Phiên khôi phục do lỗi hệ thống</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700 flex items-start gap-2">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" />
              <span>
                Hành động này sẽ khôi phục phiên với thông tin từ thẻ (thời gian vào, khu gửi) và ghi log sự cố vào hệ thống.
              </span>
            </div>

            {/* Nút xác nhận */}
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                className="flex-1 bg-white"
                onClick={() => handleCloseRecoveryDialog(false)}
              >
                Hủy
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50"
                onClick={handleManualRecovery}
                disabled={!recoveryCardScanned}
              >
                <RefreshCw size={16} />
                Khôi phục &amp; Mở cổng
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

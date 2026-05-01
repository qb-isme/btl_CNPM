'use client';

import { useState } from 'react';
import {
  Search, Camera, CreditCard, AlertTriangle, User,
  CheckCircle2, Clock, ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export default function ExitException({ onToast }: ExitExceptionProps) {
  const [searchPlate, setSearchPlate] = useState('');
  const [matchedSessions, setMatchedSessions] = useState<ActiveSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [closedSessionId, setClosedSessionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('damaged');

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
    if (session.cardStatus === 'lost') setActiveTab('lost');
    else setActiveTab('damaged');
  };

  // Đóng phiên: xoá khỏi pool, quay về danh sách, hiện banner xanh
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
    if (s.cardStatus === 'ok') return 'The OK';
    if (s.cardStatus === 'damaged') return 'The hong';
    if (s.cardStatus === 'lost') return 'Mat the';
    return 'Khong the';
  };

  const remainingAfterClose = matchedSessions.filter(s => s.id !== closedSessionId);

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

          {/* Tabs xu ly */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-4 h-auto p-1">
              <TabsTrigger value="damaged" className="text-xs py-2">Hỏng thẻ</TabsTrigger>
              <TabsTrigger value="lost" className="text-xs py-2">Mất thẻ</TabsTrigger>
              <TabsTrigger value="error" className="text-xs py-2">Lỗi hệ thống</TabsTrigger>
              <TabsTrigger value="nodata" className="text-xs py-2">Không dữ liệu</TabsTrigger>
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

            {/* Tab: Loi he thong */}
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
                  <PersonInfo session={selectedSession} />
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
                    Phục hồi thủ công
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Khong du lieu */}
            <TabsContent value="nodata">
              <Card className="border border-[#E2E8F0]">
                <CardContent className="pt-4 flex flex-col gap-3">
                  <div className="bg-[#FEF2F2] rounded-lg p-3 text-sm text-[#EF4444] flex items-start gap-2">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <span>
                      Không có dữ liệu phiên. Xe có thể đã vào bằng cổng khác hoặc dữ liệu bị mất.
                      Yêu cầu xuất trình <strong>CCCD</strong> và ghi nhận sự cố.
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-[#F8FAFC] rounded-lg p-3">
                    <span className="text-sm text-[#64748B]">Phí tối thiểu (1h):</span>
                    <span className="font-bold text-[#EF4444]">{formatVND(5000 + 100000)}</span>
                  </div>
                  <div>
                    <label className="text-xs text-[#64748B] font-medium block mb-1">Số CCCD / CMND</label>
                    <Input placeholder="Nhập số CCCD của chủ xe..." />
                  </div>
                  <Button
                    className="w-full bg-[#EF4444] hover:bg-red-700 text-white"
                    onClick={() =>
                      handleCloseSession(
                        selectedSession.id,
                        `Đã mở khẩn cấp + ghi cảnh báo cho xe ${selectedSession.licensePlate}.`,
                        'success',
                      )
                    }
                  >
                    Mở khẩn cấp + Ghi cảnh báo
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

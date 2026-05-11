"use client";

import React, { useEffect, useMemo, useState } from 'react';
import Header from '@/components/parking/Header';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  MapPin,
  User,
  Search,
  ChevronRight,
  Image as ImageIcon,
  ShieldAlert,
  CheckSquare,
  Wrench,
  PhoneCall,
  PhoneForwarded,
} from 'lucide-react';

type UserInfo = {
  name: string;
  role: string;
};

type TicketStatus = 'pending' | 'processing' | 'resolved';
type TicketPriority = 'high' | 'medium' | 'low';
type FilterStatus = 'all' | TicketStatus;

type IncidentTicket = {
  id: string;
  category: string;
  zone: string;
  spot: string;
  description: string;
  status: TicketStatus;
  time: string;
  reporter: string;
  hasImage: boolean;
  priority: TicketPriority;
};

const INCIDENT_TICKETS_KEY = 'bk_parking_incident_tickets_v1';
const EMERGENCY_CALL_KEY = 'bk_parking_emergency_call_v1';

const MOCK_TICKETS: IncidentTicket[] = [
  {
    id: 'TCK-1042',
    category: 'Hỏng Barrier/Cổng chắn',
    zone: 'Khu C',
    spot: 'Cổng vào 1',
    description: 'Barrier không tự động mở khi quẹt thẻ. Sinh viên đang bị ùn tắc.',
    status: 'pending',
    time: '12:35:00 - Hôm nay',
    reporter: 'Nguyễn Văn A (Sinh viên)',
    hasImage: true,
    priority: 'high',
  },
  {
    id: 'TCK-1041',
    category: 'Lỗi bảng LED hiển thị',
    zone: 'Khu A',
    spot: '',
    description: 'Bảng LED ở đầu khu A hiển thị sai số lượng chỗ trống (báo còn 45 nhưng thực tế đã đầy).',
    status: 'processing',
    time: '11:20:00 - Hôm nay',
    reporter: 'Trần Thị B (Giảng viên)',
    hasImage: false,
    priority: 'medium',
  },
  {
    id: 'TCK-1040',
    category: 'Xe đỗ sai quy định',
    zone: 'Khu B',
    spot: 'B22',
    description: 'Có một xe máy đỗ lấn chiếm sang ô B23, cần nhân viên xuống xếp lại xe.',
    status: 'pending',
    time: '09:15:00 - Hôm nay',
    reporter: 'Lê Văn C (Sinh viên)',
    hasImage: true,
    priority: 'low',
  },
];

function normalizeRole(role?: string) {
  return (role ?? '').trim().toLowerCase();
}

function canHandleTickets(role?: string) {
  return ['vận hành', 'van hanh', 'staff', 'nhân viên vận hành', 'nhan vien van hanh', 'bảo vệ', 'bao ve'].includes(normalizeRole(role));
}

function getStoredUser(): UserInfo {
  if (typeof window === 'undefined') return { name: 'Người dùng', role: 'Vận hành' };

  const storedUser = localStorage.getItem('user');
  if (!storedUser) return { name: 'Người dùng', role: 'Vận hành' };

  try {
    return JSON.parse(storedUser) as UserInfo;
  } catch {
    return { name: 'Người dùng', role: 'Vận hành' };
  }
}

function readStoredTickets(): IncidentTicket[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(INCIDENT_TICKETS_KEY);
    return raw ? (JSON.parse(raw) as IncidentTicket[]) : [];
  } catch {
    return [];
  }
}

function writeStoredTickets(tickets: IncidentTicket[]) {
  localStorage.setItem(INCIDENT_TICKETS_KEY, JSON.stringify(tickets));
}

function mergeTickets(storedTickets: IncidentTicket[]) {
  const storedIds = new Set(storedTickets.map((ticket) => ticket.id));
  return [...storedTickets, ...MOCK_TICKETS.filter((ticket) => !storedIds.has(ticket.id))];
}

function StatusBadge({ status }: { status: TicketStatus }) {
  switch (status) {
    case 'pending':
      return (
        <span className="flex w-fit items-center gap-1 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
          <Clock className="h-3 w-3" /> Chờ xử lý
        </span>
      );
    case 'processing':
      return (
        <span className="flex w-fit items-center gap-1 rounded-full bg-[#0284C7]/10 px-3 py-1 text-xs font-bold text-[#0284C7]">
          <Wrench className="h-3 w-3" /> Đang xử lý
        </span>
      );
    case 'resolved':
      return (
        <span className="flex w-fit items-center gap-1 rounded-full bg-[#10B981]/10 px-3 py-1 text-xs font-bold text-[#10B981]">
          <CheckCircle2 className="h-3 w-3" /> Đã giải quyết
        </span>
      );
    default:
      return null;
  }
}

export default function TechDashboard() {
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: 'Người dùng', role: 'Vận hành' });
  const [tickets, setTickets] = useState<IncidentTicket[]>(MOCK_TICKETS);
  const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');
  const [selectedTicket, setSelectedTicket] = useState<IncidentTicket | null>(null);
  const [isEmergencyCall, setIsEmergencyCall] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setUserInfo(getStoredUser());
    setTickets(mergeTickets(readStoredTickets()));

    const storedEmergencyCall = localStorage.getItem(EMERGENCY_CALL_KEY);
    if (storedEmergencyCall) {
      setIsEmergencyCall(true);
      localStorage.removeItem(EMERGENCY_CALL_KEY);
    }
  }, []);

  useEffect(() => {
    const handleStorage = () => {
      setTickets(mergeTickets(readStoredTickets()));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('bk-parking-incident-updated', handleStorage);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('bk-parking-incident-updated', handleStorage);
    };
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesFilter = activeFilter === 'all' ? true : ticket.status === activeFilter;
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        ticket.id.toLowerCase().includes(searchLower) ||
        ticket.zone.toLowerCase().includes(searchLower) ||
        ticket.category.toLowerCase().includes(searchLower) ||
        ticket.reporter.toLowerCase().includes(searchLower);

      return matchesFilter && matchesSearch;
    });
  }, [activeFilter, searchQuery, tickets]);

  const handleUpdateStatus = (id: string, newStatus: TicketStatus) => {
    const nextTickets = tickets.map((ticket) => (ticket.id === id ? { ...ticket, status: newStatus } : ticket));
    setTickets(nextTickets);
    setSelectedTicket((previous) => (previous ? { ...previous, status: newStatus } : null));
    writeStoredTickets(nextTickets);
  };

  if (!canHandleTickets(userInfo.role)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans">
        <Header />
        <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center justify-center px-6">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
            <h1 className="text-2xl font-black text-[#1E293B]">Không có quyền tiếp nhận sự cố</h1>
            <p className="mt-2 text-sm font-semibold text-[#64748B]">
              Chức năng này dành cho Nhân viên vận hành/Bảo vệ trực bãi xe.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <Header />

      <main className="flex h-[calc(100vh-73px)] flex-1 gap-6 p-6">
        <aside className="flex w-64 flex-col gap-2">
          <div className="mb-2 px-3 text-sm font-bold text-[#64748B]">BỘ LỌC TRẠNG THÁI</div>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${activeFilter === 'all' ? 'bg-[#1E293B] text-white' : 'text-[#1E293B] hover:bg-white'}`}
          >
            <span className="font-medium">Tất cả sự cố</span>
            <span className={`rounded-full px-2 py-0.5 text-xs ${activeFilter === 'all' ? 'bg-white/20' : 'bg-gray-200'}`}>{tickets.length}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('pending')}
            className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${activeFilter === 'pending' ? 'bg-[#1E293B] text-white' : 'text-[#1E293B] hover:bg-white'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span className="font-medium">Chờ xử lý</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${activeFilter === 'pending' ? 'bg-white/20' : 'bg-gray-200'}`}>
              {tickets.filter((ticket) => ticket.status === 'pending').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('processing')}
            className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${activeFilter === 'processing' ? 'bg-[#1E293B] text-white' : 'text-[#1E293B] hover:bg-white'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0284C7]" />
              <span className="font-medium">Đang xử lý</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${activeFilter === 'processing' ? 'bg-white/20' : 'bg-gray-200'}`}>
              {tickets.filter((ticket) => ticket.status === 'processing').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('resolved')}
            className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${activeFilter === 'resolved' ? 'bg-[#1E293B] text-white' : 'text-[#1E293B] hover:bg-white'}`}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
              <span className="font-medium">Đã giải quyết</span>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs ${activeFilter === 'resolved' ? 'bg-white/20' : 'bg-gray-200'}`}>
              {tickets.filter((ticket) => ticket.status === 'resolved').length}
            </span>
          </button>
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#64748B]/20 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1E293B]">Danh sách Ticket Báo Cáo</h2>
              <p className="mt-1 text-sm font-semibold text-[#64748B]">Tiếp nhận cảnh báo sự cố từ Sinh viên, Cán bộ/Giảng viên.</p>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm mã ticket, khu vực..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-72 rounded-lg border border-[#64748B]/30 py-2 pl-10 pr-4 text-sm transition-colors focus:border-[#0284C7] focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#64748B]" />
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className="group flex cursor-pointer items-center justify-between rounded-xl border border-[#64748B]/20 bg-white p-4 transition-all hover:border-[#0284C7]/50 hover:shadow-md"
              >
                <div className="flex items-start gap-4">
                  <div className={`mt-1 rounded-lg p-2 ${ticket.priority === 'high' ? 'bg-red-50 text-[#EF4444]' : ticket.priority === 'medium' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-[#0284C7]'}`}>
                    {ticket.priority === 'high' ? <ShieldAlert className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                  </div>

                  <div>
                    <div className="mb-1 flex items-center gap-3">
                      <span className="font-bold text-[#1E293B]">{ticket.id}</span>
                      <StatusBadge status={ticket.status} />
                      {ticket.hasImage && <ImageIcon className="h-4 w-4 text-[#64748B]" />}
                    </div>
                    <h3 className="mb-1 text-base font-semibold text-[#1E293B]">{ticket.category}</h3>
                    <div className="flex items-center gap-4 text-xs text-[#64748B]">
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ticket.zone} {ticket.spot && `- ${ticket.spot}`}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {ticket.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden text-right md:block">
                    <div className="mb-0.5 text-xs text-[#64748B]">Người báo cáo</div>
                    <div className="text-sm font-medium text-[#1E293B]">{ticket.reporter}</div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-[#64748B] transition-colors group-hover:text-[#0284C7]" />
                </div>
              </div>
            ))}

            {filteredTickets.length === 0 && (
              <div className="py-10 text-center text-[#64748B]">Không có ticket nào trong trạng thái này.</div>
            )}
          </div>
        </div>
      </main>

      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/60 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 p-6">
              <div>
                <div className="mb-2 flex items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#1E293B]">{selectedTicket.id}</h2>
                  <StatusBadge status={selectedTicket.status} />
                </div>
                <h3 className="text-lg font-semibold text-[#0284C7]">{selectedTicket.category}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="rounded-full p-2 text-[#64748B] transition-colors hover:bg-red-50 hover:text-[#EF4444]"
              >
                Đóng
              </button>
            </div>

            <div className="flex-1 space-y-6 p-6">
              <div className="grid grid-cols-2 gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
                <div>
                  <p className="mb-1 text-xs text-[#64748B]">Vị trí sự cố</p>
                  <p className="flex items-center gap-1 font-semibold text-[#1E293B]"><MapPin className="h-4 w-4 text-[#0284C7]" /> {selectedTicket.zone} {selectedTicket.spot && `- Ô: ${selectedTicket.spot}`}</p>
                </div>
                <div>
                  <p className="mb-1 text-xs text-[#64748B]">Thời gian ghi nhận</p>
                  <p className="flex items-center gap-1 font-semibold text-[#1E293B]"><Clock className="h-4 w-4 text-[#0284C7]" /> {selectedTicket.time}</p>
                </div>
                <div className="col-span-2">
                  <p className="mb-1 text-xs text-[#64748B]">Người báo cáo</p>
                  <p className="flex items-center gap-1 font-semibold text-[#1E293B]"><User className="h-4 w-4 text-[#0284C7]" /> {selectedTicket.reporter}</p>
                </div>
              </div>

              <div>
                <h4 className="mb-2 text-sm font-bold text-[#1E293B]">Mô tả chi tiết:</h4>
                <div className="rounded-xl border border-[#64748B]/30 bg-white p-4 text-sm leading-relaxed text-[#1E293B]">{selectedTicket.description}</div>
              </div>

              {selectedTicket.hasImage && (
                <div>
                  <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-[#1E293B]"><ImageIcon className="h-4 w-4" /> Hình ảnh minh chứng:</h4>
                  <div className="relative flex h-48 w-full cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-gray-300 bg-gray-200">
                    <div className="absolute inset-0 flex items-center justify-center bg-black/5">
                      <span className="text-sm font-medium text-[#64748B]">Ảnh hiện trường (Giả lập)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 rounded-b-2xl border-t border-gray-100 bg-gray-50 p-6">
              {selectedTicket.status === 'pending' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'processing')}
                  className="flex items-center gap-2 rounded-lg bg-[#0284C7] px-6 py-2.5 font-medium text-white shadow-lg shadow-[#0284C7]/20 transition-colors hover:bg-[#026aa3]"
                >
                  <Wrench className="h-4 w-4" /> Tiếp nhận xử lý
                </button>
              )}

              {selectedTicket.status === 'processing' && (
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedTicket.id, 'resolved')}
                  className="flex items-center gap-2 rounded-lg bg-[#10B981] px-6 py-2.5 font-medium text-white shadow-lg shadow-[#10B981]/20 transition-colors hover:bg-emerald-600"
                >
                  <CheckSquare className="h-4 w-4" /> Đánh dấu Hoàn Thành
                </button>
              )}

              {selectedTicket.status === 'resolved' && (
                <div className="flex items-center gap-2 px-4 py-2 font-bold text-[#10B981]"><CheckCircle2 className="h-5 w-5" /> Sự cố đã được giải quyết</div>
              )}
            </div>
          </div>
        </div>
      )}

      {isEmergencyCall && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E293B]/90 p-4 backdrop-blur-md">
          <div className="w-full max-w-sm rounded-3xl border-4 border-[#EF4444] bg-white p-8 text-center shadow-[0_0_50px_rgba(239,68,68,0.4)]">
            <div className="relative mx-auto mb-6 h-24 w-24">
              <div className="absolute inset-0 animate-ping rounded-full bg-red-200 opacity-75" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[#EF4444] shadow-xl">
                <PhoneCall className="h-10 w-10 animate-bounce text-white" />
              </div>
            </div>

            <h2 className="mb-2 text-3xl font-black uppercase tracking-wide text-[#EF4444]">Cảnh báo SOS!</h2>
            <p className="mb-1 text-lg font-semibold text-[#1E293B]">Cuộc gọi khẩn cấp từ bãi xe</p>
            <p className="mb-8 text-sm text-[#64748B]">Khu vực: Đang định vị... • Hotline trực ban</p>

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={() => setIsEmergencyCall(false)}
                className="flex-1 rounded-xl bg-gray-100 px-4 py-3 font-bold text-[#1E293B] transition-colors hover:bg-gray-200"
              >
                Tắt chuông
              </button>
              <button
                type="button"
                onClick={() => setIsEmergencyCall(false)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#10B981] px-4 py-3 font-bold text-white shadow-lg shadow-emerald-500/30 transition-colors hover:bg-emerald-600"
              >
                <PhoneForwarded className="h-5 w-5" /> Nghe máy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

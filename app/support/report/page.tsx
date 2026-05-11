"use client";

import React, { ChangeEvent, useEffect, useRef, useState } from 'react';
import Header from '@/components/parking/Header';
import {
  AlertTriangle,
  UploadCloud,
  CheckCircle2,
  XCircle,
  PhoneCall,
  MapPin,
  ChevronDown,
  Info,
} from 'lucide-react';

type UserInfo = {
  name: string;
  role: string;
};

type FormDataState = {
  category: string;
  zone: string;
  spot: string;
  description: string;
  file: File | null;
};

type FormErrors = Partial<Record<'category' | 'zone' | 'description', string>>;
type SubmitStatus = 'idle' | 'loading' | 'success' | 'network_error';
type TicketStatus = 'pending' | 'processing' | 'resolved';
type TicketPriority = 'high' | 'medium' | 'low';

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

const categoryLabels: Record<string, string> = {
  led: 'Lỗi bảng LED hiển thị',
  barrier: 'Hỏng Barrier/Cổng chắn',
  wrong_park: 'Xe đỗ sai quy định',
  app_error: 'Lỗi ứng dụng',
  other: 'Khác',
};

function getStoredUser(): UserInfo {
  if (typeof window === 'undefined') return { name: 'Người dùng', role: 'Sinh viên' };

  const storedUser = localStorage.getItem('user');
  if (!storedUser) return { name: 'Người dùng', role: 'Sinh viên' };

  try {
    return JSON.parse(storedUser) as UserInfo;
  } catch {
    return { name: 'Người dùng', role: 'Sinh viên' };
  }
}

function normalizeRole(role?: string) {
  return (role ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ');
}

function canReportIncident(role?: string) {
  const value = normalizeRole(role);

  return [
    'sinh vien',
    'student',
    'hoc vien',
    'can bo',
    'giang vien',
    'can bo/giang vien',
    'giang vien/can bo',
    'nguoi dung noi bo',
  ].includes(value);
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

function getPriority(category: string): TicketPriority {
  if (category === 'barrier') return 'high';
  if (category === 'led' || category === 'wrong_park') return 'medium';
  return 'low';
}

function buildTicket(formData: FormDataState, userInfo: UserInfo): IncidentTicket {
  const categoryLabel = categoryLabels[formData.category] ?? 'Khác';
  const currentTime = new Date().toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return {
    id: `TCK-${Date.now().toString().slice(-5)}`,
    category: categoryLabel,
    zone: `Khu ${formData.zone}`,
    spot: formData.spot.trim(),
    description: formData.description.trim(),
    status: 'pending',
    time: `${currentTime} - Hôm nay`,
    reporter: `${userInfo.name} (${userInfo.role})`,
    hasImage: Boolean(formData.file),
    priority: getPriority(formData.category),
  };
}

export default function IncidentReport() {
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: 'Người dùng', role: 'Sinh viên' });

  const [formData, setFormData] = useState<FormDataState>({
    category: '',
    zone: '',
    spot: '',
    description: '',
    file: null,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [fileError, setFileError] = useState('');
  const [showSOSModal, setShowSOSModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setUserInfo(getStoredUser());
  }, []);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setFileError('Định dạng không hỗ trợ. Chỉ nhận .jpg, .png');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFileError('Tệp quá lớn. Giới hạn 5MB.');
      return;
    }

    setFileError('');
    setFormData({ ...formData, file });
  };

  const handleSubmit = () => {
    setErrors({});
    setFileError('');

    const newErrors: FormErrors = {};
    if (!formData.category) newErrors.category = 'Vui lòng chọn phân loại lỗi';
    if (!formData.zone) newErrors.zone = 'Vui lòng chọn khu vực';
    if (!formData.description) newErrors.description = 'Vui lòng nhập mô tả chi tiết';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setStatus('loading');

    setTimeout(() => {
      const isNetworkError = Math.random() < 0.2;

      if (isNetworkError) {
        setStatus('network_error');
        setTimeout(() => setStatus('idle'), 4000);
        return;
      }

      const newTicket = buildTicket(formData, userInfo);
      writeStoredTickets([newTicket, ...readStoredTickets()]);
      window.dispatchEvent(new Event('bk-parking-incident-updated'));

      setStatus('success');
      setTimeout(() => {
        setStatus('idle');
        setFormData({ category: '', zone: '', spot: '', description: '', file: null });
        if (fileInputRef.current) fileInputRef.current.value = '';
      }, 3000);
    }, 1500);
  };

  const handleSOS = () => {
    setShowSOSModal(true);
    localStorage.setItem(
      EMERGENCY_CALL_KEY,
      JSON.stringify({
        reporter: userInfo.name,
        role: userInfo.role,
        time: new Date().toISOString(),
      }),
    );
  };

  if (!canReportIncident(userInfo.role)) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans">
        <Header />
        <main className="mx-auto flex min-h-[calc(100vh-73px)] max-w-4xl items-center justify-center px-6">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-8 text-center shadow-sm">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-amber-500" />
            <h1 className="text-2xl font-black text-[#1E293B]">Không có quyền gửi báo cáo sự cố</h1>
            <p className="mt-2 text-sm font-semibold text-[#64748B]">
              Chức năng này dành cho Sinh viên, Học viên, Cán bộ/Giảng viên hoặc Người dùng nội bộ.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans">
      <Header />

      <main className="flex min-h-[calc(100vh-73px)] gap-5 overflow-hidden p-5">
        <aside className="flex w-72 shrink-0 flex-col gap-4">
          <div className="rounded-2xl border border-[#64748B]/20 bg-white p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <Info className="h-5 w-5 text-[#0284C7]" />
              <h2 className="font-semibold text-[#1E293B]">Hướng dẫn báo cáo</h2>
            </div>
            <p className="text-[13px] leading-relaxed text-[#64748B]">
              Biểu mẫu này dùng để báo cáo các sự cố vật lý hoặc phần mềm tại bãi xe. Ticket của bạn sẽ được gửi trực tiếp đến nhân viên vận hành trung tâm.
            </p>
          </div>

          <div className="mt-auto rounded-2xl border border-[#EF4444]/30 bg-red-50 p-4 shadow-sm">
            <h3 className="mb-1.5 flex items-center gap-2 text-sm font-bold text-[#EF4444]">
              <AlertTriangle className="h-4 w-4" /> TRƯỜNG HỢP KHẨN CẤP
            </h3>
            <p className="mb-3 text-[12px] text-[#64748B]">
              Nếu phát hiện sự cố đe dọa an toàn như chập điện hoặc tai nạn, vui lòng bỏ qua biểu mẫu này và liên hệ ngay.
            </p>
            <button
              type="button"
              onClick={handleSOS}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#EF4444] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-red-500/30 transition-colors hover:bg-red-600"
            >
              <PhoneCall className="h-4 w-4" /> GỌI SOS KHẨN CẤP
            </button>
          </div>
        </aside>

        <div className="relative flex min-h-0 flex-1 items-center justify-center rounded-[24px] bg-[#1E293B] p-6 shadow-xl">
          <div className="flex max-h-full w-full max-w-[900px] flex-col overflow-y-auto rounded-xl bg-white p-6 shadow-2xl">
            <h2 className="mb-4 shrink-0 border-b border-gray-100 pb-3 text-xl font-bold text-[#1E293B]">
              Gửi Báo Cáo Sự Cố
            </h2>

            {status === 'network_error' && (
              <div className="mb-4 flex shrink-0 items-start gap-3 rounded-r-lg border-l-4 border-[#EF4444] bg-red-50 p-3">
                <XCircle className="h-5 w-5 shrink-0 text-[#EF4444]" />
                <div>
                  <h4 className="text-sm font-semibold text-[#EF4444]">Lỗi kết nối máy chủ</h4>
                  <p className="text-xs text-[#EF4444]/80">Không thể gửi báo cáo lúc này. Vui lòng thử lại sau.</p>
                </div>
              </div>
            )}

            <div className="grid min-h-0 flex-1 grid-cols-2 gap-6">
              <div className="flex flex-col space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-[13px] font-semibold text-[#1E293B]">
                      Phân loại lỗi <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.category}
                        onChange={(event) => setFormData({ ...formData, category: event.target.value })}
                        className={`w-full appearance-none rounded-lg border bg-white py-2 pl-3 pr-8 text-sm text-[#1E293B] transition-all focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7] ${errors.category ? 'border-[#EF4444] ring-1 ring-[#EF4444]/20' : 'border-[#64748B]/40'}`}
                      >
                        <option value="">-- Chọn loại sự cố --</option>
                        <option value="led">Lỗi bảng LED hiển thị</option>
                        <option value="barrier">Hỏng Barrier</option>
                        <option value="wrong_park">Xe đỗ sai quy định</option>
                        <option value="app_error">Lỗi ứng dụng</option>
                        <option value="other">Khác</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-[#64748B]" />
                    </div>
                    {errors.category && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[#EF4444]"><AlertTriangle className="h-3 w-3" /> {errors.category}</p>
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-[13px] font-semibold text-[#1E293B]">
                      Khu vực <span className="text-[#EF4444]">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.zone}
                        onChange={(event) => setFormData({ ...formData, zone: event.target.value })}
                        className={`w-full appearance-none rounded-lg border bg-white py-2 pl-3 pr-8 text-sm text-[#1E293B] transition-all focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7] ${errors.zone ? 'border-[#EF4444] ring-1 ring-[#EF4444]/20' : 'border-[#64748B]/40'}`}
                      >
                        <option value="">-- Chọn khu vực --</option>
                        <option value="A">Khu A</option>
                        <option value="B">Khu B</option>
                        <option value="C">Khu C</option>
                        <option value="D">Khu D</option>
                        <option value="E">Khu E</option>
                        <option value="F">Khu F</option>
                      </select>
                      <MapPin className="pointer-events-none absolute right-2 top-2.5 h-4 w-4 text-[#64748B]" />
                    </div>
                    {errors.zone && (
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-[#EF4444]"><AlertTriangle className="h-3 w-3" /> {errors.zone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[13px] font-semibold text-[#1E293B]">Mã ô đỗ (Nếu có)</label>
                  <input
                    type="text"
                    placeholder="VD: A15, B22..."
                    value={formData.spot}
                    onChange={(event) => setFormData({ ...formData, spot: event.target.value })}
                    className="w-full rounded-lg border border-[#64748B]/40 bg-white px-3 py-2 text-sm text-[#1E293B] transition-all focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7]"
                  />
                </div>

                <div className="flex flex-1 flex-col">
                  <label className="mb-1 block text-[13px] font-semibold text-[#1E293B]">
                    Mô tả chi tiết <span className="text-[#EF4444]">*</span>
                  </label>
                  <textarea
                    placeholder="Mô tả rõ tình trạng bạn gặp phải..."
                    value={formData.description}
                    onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                    className={`min-h-[80px] w-full flex-1 resize-none rounded-lg border bg-white px-3 py-2 text-sm text-[#1E293B] transition-all focus:border-[#0284C7] focus:outline-none focus:ring-1 focus:ring-[#0284C7] ${errors.description ? 'border-[#EF4444] ring-1 ring-[#EF4444]/20' : 'border-[#64748B]/40'}`}
                  />
                  {errors.description && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-[#EF4444]"><AlertTriangle className="h-3 w-3" /> {errors.description}</p>
                  )}
                </div>
              </div>

              <div className="flex h-full flex-col">
                <label className="mb-1 block text-[13px] font-semibold text-[#1E293B]">Hình ảnh minh chứng</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`flex w-full flex-1 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors ${fileError ? 'border-[#EF4444] bg-red-50' : formData.file ? 'border-[#10B981] bg-[#10B981]/5' : 'border-[#64748B]/40 bg-gray-50 hover:bg-gray-100'}`}
                >
                  <input
                    type="file"
                    className="hidden"
                    ref={fileInputRef}
                    accept=".jpg,.jpeg,.png"
                    onChange={handleFileChange}
                  />

                  {formData.file ? (
                    <div className="flex flex-col items-center text-center text-[#10B981]">
                      <CheckCircle2 className="mb-2 h-8 w-8" />
                      <span className="break-all text-sm font-medium">{formData.file.name}</span>
                      <span className="mt-1 text-xs text-[#64748B]">Nhấn để chọn file khác</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center text-[#64748B]">
                      <UploadCloud className="mb-2 h-8 w-8 text-[#0284C7]" />
                      <span className="text-[13px] font-medium text-[#1E293B]">Nhấn hoặc Kéo thả ảnh</span>
                      <span className="mt-1 text-[11px]">Hỗ trợ .JPG, .PNG (Max 5MB)</span>
                    </div>
                  )}
                </div>
                {fileError && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-[#EF4444]"><AlertTriangle className="h-3 w-3" /> {fileError}</p>
                )}

                <div className="mt-5 flex shrink-0 justify-end">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={status === 'loading'}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0284C7] px-6 py-2.5 text-sm font-medium text-white shadow-md shadow-[#0284C7]/20 transition-all hover:bg-[#026aa3] disabled:bg-[#0284C7]/60"
                  >
                    {status === 'loading' ? (
                      <>
                        <svg className="-ml-1 mr-2 h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang xử lý...
                      </>
                    ) : (
                      'Gửi báo cáo'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {status === 'success' && (
        <div className="fixed right-6 top-20 z-50 flex items-center gap-3 rounded-lg border-l-4 border-[#10B981] bg-white p-4 shadow-xl animate-bounce">
          <CheckCircle2 className="h-6 w-6 text-[#10B981]" />
          <div>
            <h4 className="text-sm font-bold text-[#1E293B]">Gửi thành công!</h4>
            <p className="text-xs text-[#64748B]">Ticket đã được chuyển đến NV Vận hành.</p>
          </div>
        </div>
      )}

      {showSOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E293B]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm animate-pulse rounded-2xl bg-white p-8 text-center shadow-2xl">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-8 w-8 text-[#EF4444]" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-[#1E293B]">Đang chuyển hướng gọi...</h2>
            <p className="mb-5 text-[13px] text-[#64748B]">Hệ thống đang kết nối thiết bị của bạn với Hotline Trực ban An ninh.</p>
            <p className="mb-5 text-[12px] font-medium text-[#EF4444]">Biểu mẫu báo cáo đã bị hủy bỏ.</p>
            <button
              type="button"
              onClick={() => setShowSOSModal(false)}
              className="w-full rounded-lg border border-[#64748B]/40 py-2 text-sm font-medium text-[#64748B] transition-colors hover:bg-gray-50"
            >
              Hủy gọi (Đóng)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

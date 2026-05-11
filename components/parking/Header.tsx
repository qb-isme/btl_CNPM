"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  ChevronDown,
  ClipboardList,
  Clock,
  Cpu,
  CreditCard,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  Map,
  Settings,
  ShieldAlert,
  User,
} from "lucide-react";

type UserInfo = {
  name: string;
  role: string;
};

type NavItem = {
  name: string;
  path: string;
  description: string;
  icon: React.ReactNode;
};

type SystemRole = "Ban quản lý" | "IT" | "Vận hành" | "Người dùng nội bộ" | "Không xác định";

function normalizeSystemRole(role?: string): SystemRole {
  const value = (role ?? "").trim().toLowerCase();

  if (["admin", "ban quản lý", "ban quản lí", "ban quan ly", "quản lý", "quan ly"].includes(value)) {
    return "Ban quản lý";
  }

  if (["it", "quản trị hệ thống", "quan tri he thong", "quản trị hệ thống phần mềm"].includes(value)) {
    return "IT";
  }

  if (
    [
      "vận hành",
      "van hanh",
      "staff",
      "nhân viên vận hành",
      "nhan vien van hanh",
      "bảo vệ",
      "bao ve",
      "kỹ thuật",
      "ky thuat",
      "nhân viên kỹ thuật",
      "nhan vien ky thuat",
      "kỹ thuật viên",
      "ky thuat vien",
    ].includes(value)
  ) {
    return "Vận hành";
  }

  if (
    [
      "sinh viên",
      "sinh vien",
      "student",
      "học viên",
      "hoc vien",
      "cán bộ",
      "can bo",
      "giảng viên",
      "giang vien",
      "cán bộ/giảng viên",
      "can bo/giang vien",
      "giảng viên/cán bộ",
      "giang vien/can bo",
      "người dùng nội bộ",
      "nguoi dung noi bo",
    ].includes(value)
  ) {
    return "Người dùng nội bộ";
  }

  return "Không xác định";
}

function getDisplayRoleLabel(role?: string) {
  const value = (role ?? '').trim();

  if (!value) return 'KHÔNG XÁC ĐỊNH';

  const lower = value.toLowerCase();
  if (['sinh viên', 'sinh vien', 'student'].includes(lower)) return 'SINH VIÊN';
  if (['học viên', 'hoc vien'].includes(lower)) return 'HỌC VIÊN';
  if (['giảng viên/cán bộ', 'giang vien/can bo', 'cán bộ/giảng viên', 'can bo/giang vien'].includes(lower)) return 'GIẢNG VIÊN / CÁN BỘ';
  if (['giảng viên', 'giang vien', 'cán bộ', 'can bo'].includes(lower)) return 'GIẢNG VIÊN / CÁN BỘ';
  if (['người dùng nội bộ', 'nguoi dung noi bo'].includes(lower)) return 'NGƯỜI DÙNG NỘI BỘ';
  if (['ban quản lý', 'ban quản lí', 'ban quan ly', 'admin'].includes(lower)) return 'BAN QUẢN LÝ';
  if (lower === 'it') return 'IT';
  if (['vận hành', 'van hanh', 'bảo vệ', 'bao ve'].includes(lower)) return 'VẬN HÀNH';
  if (['kỹ thuật', 'ky thuat', 'kỹ thuật viên', 'ky thuat vien', 'nhân viên kỹ thuật', 'nhan vien ky thuat'].includes(lower)) return 'VẬN HÀNH';

  return value.toUpperCase();
}

function getSettingsDescription(role: SystemRole) {
  if (role === "Ban quản lý") return "Quản lý chính sách định giá";
  if (role === "IT") return "Quản lý phân quyền và tài khoản nội bộ";
  if (role === "Vận hành") return "Cấu hình phân vùng và bảo lưu ô đỗ";
  return "Quản lý cấu hình theo quyền được cấp";
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement | null>(null);

  const [currentTime, setCurrentTime] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "Người dùng", role: "Sinh viên" });

  useEffect(() => {
    const updateTime = () => {
      setCurrentTime(
        new Date().toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        setUserInfo(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
      }
    }

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayRole = getDisplayRoleLabel(userInfo.role);

  const navItems = useMemo<NavItem[]>(() => {
    const role = normalizeSystemRole(userInfo.role);
    const items: NavItem[] = [];

    if (role === "Người dùng nội bộ") {
      items.push(
        {
          name: "Bản đồ bãi xe",
          path: "/map",
          description: "Xem tình trạng bãi đỗ và chỉ đường đến ô trống",
          icon: <Map size={18} />,
        },
        {
          name: "Tài khoản gửi xe",
          path: "/dashboard",
          description: "Xem dư nợ, số dư và thông tin tài khoản",
          icon: <User size={18} />,
        },
        {
          name: "Thanh toán phí gửi xe",
          path: "/payment",
          description: "Tổng hợp phiên chờ thanh toán và thanh toán qua BKPay",
          icon: <CreditCard size={18} />,
        },
        {
          name: "Lịch sử giao dịch",
          path: "/history",
          description: "Tra cứu lịch sử, nợ phí và xuất biên lai",
          icon: <History size={18} />,
        },
        {
          name: "Báo cáo sự cố",
          path: "/support/report",
          description: "Gửi ticket sự cố thực địa cho nhân viên vận hành",
          icon: <LifeBuoy size={18} />,
        },
      );
    }

    if (role === "Vận hành") {
      items.push(
        {
          name: "Bản đồ bãi xe",
          path: "/map",
          description: "Xem tình trạng bãi đỗ theo thời gian thực",
          icon: <Map size={18} />,
        },
        {
          name: "Xe vào",
          path: "/xe-vao",
          description: "Xử lý cổng vào cho người dùng nội bộ và khách vãng lai",
          icon: <LogIn size={18} />,
        },
        {
          name: "Xe ra",
          path: "/xe-ra",
          description: "Xử lý cổng ra, đối chiếu thẻ và biển số",
          icon: <LogOut size={18} />,
        },
        {
          name: "Vận hành cổng",
          path: "/gate-ops",
          description: "Xử lý ngoại lệ xe ra, cảnh báo an ninh và barrier khẩn cấp",
          icon: <ShieldAlert size={18} />,
        },
        {
          name: "Giám sát thiết bị",
          path: "/admin/dashboard",
          description: "Theo dõi trạng thái cảm biến, gateway và bảng LED IoT",
          icon: <Cpu size={18} />,
        },
        {
          name: "Tiếp nhận sự cố",
          path: "/support/tickets",
          description: "Theo dõi, tiếp nhận và cập nhật trạng thái ticket",
          icon: <ClipboardList size={18} />,
        },
      );
    }

    if (role === "Ban quản lý" || role === "IT" || role === "Vận hành") {
      items.push({
        name: "Cấu hình hệ thống",
        path: "/admin/settings",
        description: getSettingsDescription(role),
        icon: <Settings size={18} />,
      });
    }

    if (role === "Ban quản lý") {
      items.unshift({
        name: "Bản đồ bãi xe",
        path: "/map",
        description: "Xem tổng quan tình trạng bãi đỗ",
        icon: <Map size={18} />,
      });

      items.push({
        name: "Báo cáo & phân tích",
        path: "/reports",
        description: "Thống kê doanh thu, heatmap và đối soát BKPay",
        icon: <BarChart3 size={18} />,
      });
    }

    return items;
  }, [userInfo.role]);

  const activeItem = navItems.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));

  const handleLogout = () => {
    localStorage.removeItem("user");
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 flex w-full items-center justify-between border-b border-slate-300 bg-[#E2E8F0] px-6 py-3 shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/map" className="flex flex-col">
          <span className="text-xl font-black leading-none text-[#1E293B]">BK-PARKING</span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#0284C7]">Smart Solution</span>
        </Link>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((previous) => !previous)}
            className={`flex min-w-[280px] items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-sm font-black transition-all ${
              activeItem ? "bg-[#0284C7] text-white shadow-sm shadow-sky-200" : "bg-white/70 text-[#475569] hover:bg-white"
            }`}
          >
            <span className="flex items-center gap-2">
              {activeItem?.icon ?? <LayoutDashboard size={18} />}
              {activeItem?.name ?? "Chức năng hệ thống"}
            </span>
            <ChevronDown size={18} className={`transition-transform ${menuOpen ? "rotate-180" : ""}`} />
          </button>

          {menuOpen && (
            <div className="absolute left-0 top-[calc(100%+10px)] w-[400px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-300/70">
              <div className="border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-black uppercase tracking-wider text-[#94A3B8]">Danh mục chức năng</p>
              </div>

              <div className="p-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);

                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setMenuOpen(false)}
                      className={`flex items-start gap-3 rounded-xl px-3 py-3 transition ${
                        isActive ? "bg-[#E0F2FE] text-[#0284C7]" : "text-[#475569] hover:bg-slate-50 hover:text-[#1E293B]"
                      }`}
                    >
                      <span className={`mt-0.5 rounded-lg p-2 ${isActive ? "bg-white" : "bg-slate-100"}`}>{item.icon}</span>
                      <span>
                        <span className="block text-sm font-black">{item.name}</span>
                        <span className="mt-0.5 block text-xs font-semibold text-[#64748B]">{item.description}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden items-center gap-2 rounded-lg border border-white/60 bg-white/70 px-4 py-2 font-mono font-medium text-[#64748B] lg:flex">
          <Clock size={16} />
          {currentTime}
        </div>

        <div className="flex items-center gap-3 border-l border-slate-300 pl-6">
          <div className="text-right">
            <p className="text-sm font-bold leading-none text-[#1E293B]">{userInfo.name}</p>
            <p className="mt-1 text-[10px] font-bold uppercase text-[#0284C7]">Role: {displayRole}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white/70">
            <User size={20} className="text-[#0284C7]" />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl p-2.5 text-[#EF4444] transition-colors hover:bg-red-50"
            aria-label="Đăng xuất"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </header>
  );
}

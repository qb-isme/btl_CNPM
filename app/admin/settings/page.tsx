"use client";

import React, { useEffect, useMemo, useState } from "react";
import Header from "@/components/parking/Header";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Edit2,
  Mail,
  Search,
  Trash2,
  User,
} from "lucide-react";
import {
  INITIAL_PARKING_ZONES,
  getAvailableCount,
  getUnavailableCount,
  getZoneStatusLabel,
  readParkingZonesFromStorage,
  writeParkingZonesToStorage,
  type ParkingSlot,
  type ParkingZone,
  type SlotStatus,
  type ZoneId,
  type ZoneMode,
} from "@/lib/parking-data";

type TabKey = "pricing" | "users" | "zones";
type PolicyGroup = "Sinh viên" | "Giảng viên" | "Khách";
type VehicleType = "Xe máy" | "ô tô";
type RoleType = "Nhân viên vận hành" | "Kỹ thuật viên" | "Quản trị hệ thống";

type Policy = {
  id: number;
  name: string;
  group: PolicyGroup;
  price: number;
  vehicle: VehicleType;
  status: boolean;
};

type InternalUser = {
  id: number;
  name: string;
  email: string;
  role: RoleType;
  active: boolean;
};


const INITIAL_POLICIES: Policy[] = [
  { id: 1, name: "Sinh viên nhà trường", group: "Sinh viên", price: 2000, vehicle: "Xe máy", status: true },
  { id: 2, name: "Cán bộ / Giảng viên", group: "Giảng viên", price: 0, vehicle: "Xe máy", status: true },
  { id: 3, name: "Giảng viên đi ô tô", group: "Giảng viên", price: 10000, vehicle: "ô tô", status: true },
  { id: 4, name: "Khách vãng lai", group: "Khách", price: 5000, vehicle: "Xe máy", status: true },
];

const INITIAL_USERS: InternalUser[] = [
  { id: 1, name: "Nguyễn Văn Hành", email: "nhanvien01@hcmut.edu.vn", role: "Nhân viên vận hành", active: true },
  { id: 2, name: "Kỹ Thuật Viên", email: "kythuatvien@hcmut.edu.vn", role: "Kỹ thuật viên", active: true },
  { id: 3, name: "Admin", email: "admin@hcmut.edu.vn", role: "Quản trị hệ thống", active: true },
];

const roleOptions: RoleType[] = ["Nhân viên vận hành", "Kỹ thuật viên", "Quản trị hệ thống"];
const INTERNAL_USERS_STORAGE_KEY = "bk_internal_users_v1";

type SystemRole = "Ban quản lý" | "IT" | "Vận hành" | "Sinh viên" | "Không xác định";

function normalizeSystemRole(role?: string): SystemRole {
  const value = (role ?? "").trim().toLowerCase();

  if (["admin", "ban quản lý", "ban quản lí", "ban quan ly", "quản lý", "quan ly"].includes(value)) {
    return "Ban quản lý";
  }

  if (["it", "quản trị hệ thống", "quan tri he thong", "quản trị hệ thống phần mềm", "ky thuat vien", "kỹ thuật viên"].includes(value)) {
    return "IT";
  }

  if (["vận hành", "van hanh", "staff", "nhân viên vận hành", "nhan vien van hanh", "bảo vệ", "bao ve"].includes(value)) {
    return "Vận hành";
  }

  if (["sinh viên", "sinh vien", "student"].includes(value)) {
    return "Sinh viên";
  }

  return "Không xác định";
}

function getDefaultTabByRole(role: SystemRole): TabKey {
  if (role === "IT") return "users";
  if (role === "Vận hành") return "zones";
  return "pricing";
}

function getPermissionMessage(tab: TabKey) {
  if (tab === "pricing") return "Chỉ Ban quản lý được thêm, chỉnh sửa hoặc vô hiệu chính sách giá.";
  if (tab === "users") return "Chỉ IT / Quản trị hệ thống phần mềm được cấp, cập nhật hoặc thu hồi quyền tài khoản nội bộ.";
  return "Chỉ Nhân viên vận hành / Bảo vệ được cấu hình phân vùng và bảo lưu ô đỗ.";
}

function formatMoney(price: number) {
  return price > 0 ? price.toLocaleString("vi-VN") : "Miễn phí";
}

function getZoneCardClass(zone: ParkingZone, isSelected: boolean) {
  const selectedRing = isSelected ? "ring-4 ring-[#0284C7]/25 border-[#0284C7]" : "border-transparent";

  if (zone.mode === "offline") {
    return `${selectedRing} bg-[#94A3B8] text-white`;
  }

  if (zone.mode === "maintenance") {
    return `${selectedRing} bg-[repeating-linear-gradient(45deg,#fee2e2_0,#fee2e2_10px,#fff1f2_10px,#fff1f2_20px)] text-[#1E293B] border-dashed border-[#EF4444]`;
  }

  const unavailableCount = getUnavailableCount(zone);
  if (unavailableCount >= zone.slots.length) return `${selectedRing} bg-[#EF4444] text-white`;
  if (unavailableCount >= 9) return `${selectedRing} bg-[#F59E0B] text-white`;
  return `${selectedRing} bg-[#10B981] text-white`;
}

function readInternalUsersFromStorage(): InternalUser[] | null {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(INTERNAL_USERS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    const validUsers = parsed.filter((user): user is InternalUser => {
      return (
        user &&
        typeof user.id === "number" &&
        typeof user.name === "string" &&
        typeof user.email === "string" &&
        typeof user.role === "string" &&
        typeof user.active === "boolean"
      );
    });

    return validUsers.length > 0 ? validUsers : null;
  } catch {
    return null;
  }
}

function writeInternalUsersToStorage(users: InternalUser[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INTERNAL_USERS_STORAGE_KEY, JSON.stringify(users));
}

function getDisplayNameFromEmail(email: string) {
  const prefix = email.split("@")[0]?.trim();
  if (!prefix) return "Tài khoản nội bộ";
  return prefix
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getSlotColorClass(status: SlotStatus, isSelected: boolean, disabled: boolean, isPending: boolean) {
  if (disabled) {
    return "bg-[#94A3B8]/40 text-white cursor-not-allowed";
  }

  if (isSelected) {
    return "bg-[#0284C7] text-white shadow-md scale-105 border border-[#0369A1]";
  }

  if (isPending) {
    return "bg-[#F59E0B] text-white border-2 border-dashed border-[#B45309] hover:bg-[#D97706]";
  }

  if (status === "empty") return "bg-[#10B981] text-white hover:bg-[#059669]";
  if (status === "occupied") return "bg-[#94A3B8] text-white hover:bg-[#64748B]";
  return "bg-[#F59E0B] text-white hover:bg-[#D97706]";
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("pricing");
  const [currentUserRole, setCurrentUserRole] = useState<SystemRole>("Không xác định");
  const [policies, setPolicies] = useState<Policy[]>(INITIAL_POLICIES);
  const [users, setUsers] = useState<InternalUser[]>(INITIAL_USERS);
  const [zones, setZones] = useState<ParkingZone[]>(INITIAL_PARKING_ZONES);
  const [zonesLoaded, setZonesLoaded] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState<ZoneId>("A");
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [pendingSlots, setPendingSlots] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [priceError, setPriceError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState<number | null>(null);
  const [newPolicyName, setNewPolicyName] = useState("");
  const [newGroup, setNewGroup] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newVehicle, setNewVehicle] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");
  const [reservationReason, setReservationReason] = useState("");
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [userDeleteConfirmId, setUserDeleteConfirmId] = useState<number | null>(null);
  const [usersLoaded, setUsersLoaded] = useState(false);

  const selectedZone = zones.find((zone) => zone.id === selectedZoneId) ?? zones[0];
  const selectedZoneDisabled = selectedZone.mode !== "active";
  const canManagePricing = currentUserRole === "Ban quản lý";
  const canManageUsers = currentUserRole === "IT";
  const canManageZones = currentUserRole === "Vận hành";
  const tabPermissions: Record<TabKey, boolean> = {
    pricing: canManagePricing,
    users: canManageUsers,
    zones: canManageZones,
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    try {
      const parsedUser = JSON.parse(storedUser) as { role?: string };
      const normalizedRole = normalizeSystemRole(parsedUser.role);
      setCurrentUserRole(normalizedRole);
      setActiveTab(getDefaultTabByRole(normalizedRole));
    } catch {
      setCurrentUserRole("Không xác định");
    }
  }, []);

  useEffect(() => {
    const storedUsers = readInternalUsersFromStorage();
    if (storedUsers) {
      setUsers(storedUsers);
    }
    setUsersLoaded(true);
  }, []);

  useEffect(() => {
    if (!usersLoaded) return;
    writeInternalUsersToStorage(users);
  }, [users, usersLoaded]);

  useEffect(() => {
    const storedZones = readParkingZonesFromStorage();
    if (storedZones) {
      setZones(storedZones);
    }
    setZonesLoaded(true);
  }, []);

  useEffect(() => {
    if (!zonesLoaded) return;
    writeParkingZonesToStorage(zones);
  }, [zones, zonesLoaded]);

  const filteredUsers = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter(
      (user) =>
        user.email.toLowerCase().includes(keyword) ||
        user.name.toLowerCase().includes(keyword) ||
        user.role.toLowerCase().includes(keyword)
    );
  }, [searchTerm, users]);

  const selectedOccupiedSlots = selectedSlots.filter((id) => selectedZone.slots.find((slot) => slot.id === id)?.status === "occupied");
  const hasOccupiedSelected = selectedOccupiedSlots.length > 0;

  const handlePriceChange = (value: string) => {
    setNewPrice(value);
    if (value && Number(value) < 0) {
      setPriceError("Giá trị không hợp lệ (giá phải >= 0)");
    } else {
      setPriceError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setNewEmail(value);
    const emailExists = users.some((user) => user.id !== editingUserId && user.email.toLowerCase() === value.trim().toLowerCase());
    if (emailExists) {
      setEmailError("Tài khoản này đã có quyền hạn vừa được nhập!");
    } else {
      setEmailError("");
    }
  };

  const handleRoleChange = (value: string) => {
    setNewRole(value);
    if (!newEmail.trim()) return;
    const duplicate = users.some(
      (user) => user.id !== editingUserId && user.email.toLowerCase() === newEmail.trim().toLowerCase() && user.role === value
    );
    setEmailError(duplicate ? "Tài khoản này đã có quyền hạn vừa được nhập!" : "");
  };

  const handleAddPolicy = () => {
    if (!canManagePricing) return;
    if (!newPolicyName.trim() || !newGroup || !newVehicle || priceError) return;

    const nextPolicy: Policy = {
      id: Date.now(),
      name: newPolicyName.trim(),
      group: newGroup as PolicyGroup,
      price: Number(newPrice || 0),
      vehicle: newVehicle as VehicleType,
      status: true,
    };

    setPolicies((previous) => [...previous, nextPolicy]);
    setNewPolicyName("");
    setNewGroup("");
    setNewPrice("");
    setNewVehicle("");
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setNewEmail("");
    setNewRole("");
    setEmailError("");
  };

  const handleEditUser = (user: InternalUser) => {
    if (!canManageUsers) return;
    setEditingUserId(user.id);
    setNewEmail(user.email);
    setNewRole(user.role);
    setEmailError("");
  };

  const handleSubmitUser = () => {
    if (!canManageUsers) return;
    if (!newEmail.trim() || !newRole || emailError) return;

    const normalizedEmail = newEmail.trim();

    if (editingUserId !== null) {
      setUsers((previous) =>
        previous.map((user) =>
          user.id === editingUserId
            ? {
                ...user,
                email: normalizedEmail,
                name: getDisplayNameFromEmail(normalizedEmail),
                role: newRole as RoleType,
              }
            : user
        )
      );
      resetUserForm();
      return;
    }

    const nextUser: InternalUser = {
      id: Date.now(),
      name: getDisplayNameFromEmail(normalizedEmail),
      email: normalizedEmail,
      role: newRole as RoleType,
      active: true,
    };

    setUsers((previous) => [...previous, nextUser]);
    resetUserForm();
  };

  const handleDeleteUser = (userId: number) => {
    if (!canManageUsers) return;
    setUserDeleteConfirmId(userId);
  };

  const confirmDeleteUser = () => {
    if (!canManageUsers || userDeleteConfirmId === null) return;

    setUsers((previous) => previous.filter((user) => user.id !== userDeleteConfirmId));

    if (editingUserId === userDeleteConfirmId) {
      resetUserForm();
    }

    setUserDeleteConfirmId(null);
  };

  const handleDisablePolicy = (policyId: number) => {
    if (!canManagePricing) return;
    setShowConfirmModal(policyId);
  };

  const confirmDisablePolicy = () => {
    if (!canManagePricing) return;
    if (!showConfirmModal) return;
    setPolicies((previous) =>
      previous.map((policy) => (policy.id === showConfirmModal ? { ...policy, status: false } : policy))
    );
    setShowConfirmModal(null);
  };

  const handleToggleSlot = (slotId: string) => {
    if (!canManageZones || selectedZoneDisabled) return;
    setSelectedSlots((previous) =>
      previous.includes(slotId) ? previous.filter((id) => id !== slotId) : [...previous, slotId]
    );
  };

  const updateSelectedZoneSlots = (updater: (slots: ParkingSlot[]) => ParkingSlot[]) => {
    setZones((previous) =>
      previous.map((zone) => (zone.id === selectedZoneId ? { ...zone, slots: updater(zone.slots) } : zone))
    );
  };

  const handleApplyReservation = () => {
    if (!canManageZones || selectedSlots.length === 0 || selectedZoneDisabled) return;

    updateSelectedZoneSlots((slots) =>
      slots.map((slot) => {
        if (!selectedSlots.includes(slot.id)) return slot;
        if (slot.status === "empty") return { ...slot, status: "reserved" };
        return slot;
      })
    );

    const occupiedSelected = selectedSlots.filter(
      (slotId) => selectedZone.slots.find((slot) => slot.id === slotId)?.status === "occupied"
    );

    if (occupiedSelected.length > 0) {
      setPendingSlots((previous) => Array.from(new Set([...previous, ...occupiedSelected])));
    }

    setSelectedSlots([]);
    setReservationReason("");
  };

  const handleCancelReservation = () => {
    if (!canManageZones || selectedSlots.length === 0 || selectedZoneDisabled) return;

    updateSelectedZoneSlots((slots) =>
      slots.map((slot) => (selectedSlots.includes(slot.id) && slot.status === "reserved" ? { ...slot, status: "empty" } : slot))
    );

    setPendingSlots((previous) => previous.filter((slotId) => !selectedSlots.includes(slotId)));
    setSelectedSlots([]);
    setReservationReason("");
  };

  const handleChangeZoneMode = (mode: ZoneMode) => {
    if (!canManageZones) return;
    setZones((previous) => previous.map((zone) => (zone.id === selectedZoneId ? { ...zone, mode } : zone)));
    setSelectedSlots([]);
  };

  const switchTab = (tab: TabKey) => {
    if (!tabPermissions[tab]) return;
    setActiveTab(tab);
    setSelectedSlots([]);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <Header />

      <main className="mx-auto max-w-[1600px] px-8 py-8">
        <div className="mb-8 grid w-full grid-cols-3 border-b border-[#CBD5E1] bg-white shadow-sm">
          <button
            type="button"
            onClick={() => switchTab("pricing")}
            disabled={!canManagePricing}
            title={!canManagePricing ? getPermissionMessage("pricing") : undefined}
            className={`py-4 text-base font-bold transition ${
              activeTab === "pricing"
                ? "border-b-2 border-[#0284C7] bg-[#E0F2FE] text-[#0284C7]"
                : canManagePricing
                  ? "border-b-2 border-transparent text-[#334155] hover:bg-[#F1F5F9]"
                  : "cursor-not-allowed border-b-2 border-transparent text-[#94A3B8] opacity-60"
            }`}
          >
            Quản Lý Chính Sách
          </button>
          <button
            type="button"
            onClick={() => switchTab("users")}
            disabled={!canManageUsers}
            title={!canManageUsers ? getPermissionMessage("users") : undefined}
            className={`py-4 text-base font-bold transition ${
              activeTab === "users"
                ? "border-b-2 border-[#0284C7] bg-[#E0F2FE] text-[#0284C7]"
                : canManageUsers
                  ? "border-b-2 border-transparent text-[#334155] hover:bg-[#F1F5F9]"
                  : "cursor-not-allowed border-b-2 border-transparent text-[#94A3B8] opacity-60"
            }`}
          >
            Quản Lý Phân Quyền
          </button>
          <button
            type="button"
            onClick={() => switchTab("zones")}
            disabled={!canManageZones}
            title={!canManageZones ? getPermissionMessage("zones") : undefined}
            className={`py-4 text-base font-bold transition ${
              activeTab === "zones"
                ? "border-b-2 border-[#0284C7] bg-[#E0F2FE] text-[#0284C7]"
                : canManageZones
                  ? "border-b-2 border-transparent text-[#334155] hover:bg-[#F1F5F9]"
                  : "cursor-not-allowed border-b-2 border-transparent text-[#94A3B8] opacity-60"
            }`}
          >
            Quản Lý Bãi Đỗ
          </button>
        </div>

        <div className="mb-6 rounded-xl border border-[#CBD5E1] bg-white px-5 py-4 text-sm font-semibold text-[#475569] shadow-sm">
          Quyền hiện tại: <span className="font-black text-[#0284C7]">{currentUserRole}</span>. {getPermissionMessage(activeTab)}
        </div>

        {activeTab === "pricing" && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <h2 className="mb-4 text-xl font-black tracking-tight">Danh sách chính sách đang áp dụng</h2>

              <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-[#F8FAFC]">
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-[#475569]">Tên chính sách</th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-[#475569]">Nhóm đối tượng</th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-[#475569]">Mức giá (VNĐ)</th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-[#475569]">Phương tiện</th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-[#475569]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {policies.map((policy) => (
                      <tr key={policy.id} className={`border-b transition hover:bg-[#F8FAFC] ${!policy.status ? "bg-red-50" : ""}`}>
                        <td className="px-6 py-5 font-bold text-[#0F172A]">{policy.name}</td>
                        <td className="px-6 py-5">
                          <span className="rounded-full bg-[#DBEAFE] px-3 py-1 text-sm font-bold text-[#2563EB]">{policy.group}</span>
                        </td>
                        <td className="px-6 py-5 font-black text-[#2563EB]">{formatMoney(policy.price)}</td>
                        <td className="px-6 py-5 text-[#334155]">{policy.vehicle}</td>
                        <td className="px-6 py-5">
                          <button
                            type="button"
                            onClick={() => handleDisablePolicy(policy.id)}
                            disabled={!canManagePricing || !policy.status}
                            className="rounded-lg bg-red-100 px-4 py-2 text-sm font-black text-red-600 transition hover:bg-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {policy.status ? "Vô hiệu" : "Đã vô hiệu"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="h-fit overflow-hidden rounded-2xl bg-[#F1F5F9] shadow-sm">
              <div className="bg-[#0284C7] px-6 py-4 text-white">
                <h3 className="text-base font-black uppercase tracking-wide">Thiết lập chính sách mới</h3>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-2 block text-sm font-black text-[#1E293B]">Tên chính sách</label>
                  <input
                    type="text"
                    disabled={!canManagePricing}
                    value={newPolicyName}
                    onChange={(event) => setNewPolicyName(event.target.value)}
                    placeholder="Nhập tên chính sách..."
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black text-[#1E293B]">Nhóm đối tượng</label>
                  <select
                    value={newGroup}
                    disabled={!canManagePricing}
                    onChange={(event) => setNewGroup(event.target.value)}
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0284C7]"
                  >
                    <option value="">Chọn nhóm</option>
                    <option value="Sinh viên">Sinh viên</option>
                    <option value="Giảng viên">Cán bộ / GV</option>
                    <option value="Khách">Khách vãng lai</option>
                  </select>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black text-[#1E293B]">Mức giá (VNĐ)</label>
                  <input
                    type="number"
                    disabled={!canManagePricing}
                    value={newPrice}
                    onChange={(event) => handlePriceChange(event.target.value)}
                    placeholder="Ví dụ: 2000"
                    className={`w-full rounded-lg border bg-white px-4 py-3 text-sm outline-none focus:ring-2 ${
                      priceError ? "border-red-500 focus:ring-red-500" : "border-[#CBD5E1] focus:ring-[#0284C7]"
                    }`}
                  />
                  {priceError && <p className="mt-1 text-sm font-semibold text-red-600">{priceError}</p>}
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black text-[#1E293B]">Phương tiện</label>
                  <select
                    value={newVehicle}
                    disabled={!canManagePricing}
                    onChange={(event) => setNewVehicle(event.target.value)}
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0284C7]"
                  >
                    <option value="">Chọn phương tiện</option>
                    <option value="Xe máy">Xe máy</option>
                    <option value="ô tô">Ô tô</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={handleAddPolicy}
                  disabled={!canManagePricing || !!priceError || !newPolicyName.trim() || !newGroup || !newVehicle}
                  className="w-full rounded-lg bg-[#0284C7] py-3 font-black text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Lưu và ban hành
                </button>
              </div>
            </aside>
          </section>
        )}

        {activeTab === "users" && (
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <div className="mb-6 flex items-center justify-between gap-4">
                <h2 className="text-xl font-black tracking-tight">Tài khoản nội bộ</h2>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#64748B]" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Tìm theo email..."
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-3 py-3 pl-9 text-sm outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />
                </div>
              </div>

              <div className="overflow-hidden rounded-2xl border border-[#CBD5E1] bg-white shadow-sm">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-[#F8FAFC]">
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-[#475569]">Email định danh</th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-[#475569]">Nhóm quyền (Role)</th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-[#475569]">Trạng thái</th>
                      <th className="px-6 py-4 text-left text-sm font-black uppercase tracking-wide text-[#475569]">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b transition hover:bg-[#F8FAFC]">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E0F2FE] text-[#0284C7]">
                              <User className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-black text-[#0F172A]">{user.name}</p>
                              <p className="text-sm text-[#64748B]">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="rounded-full bg-[#DCFCE7] px-3 py-1 text-sm font-bold text-[#15803D]">{user.role}</span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-[#10B981]" />
                            <span className="text-sm font-bold text-[#059669]">Active</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <button
                            type="button"
                            onClick={() => handleEditUser(user)}
                            disabled={!canManageUsers}
                            title="Chỉnh sửa tài khoản"
                            className="mr-3 text-[#94A3B8] transition hover:text-[#0284C7] disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id)}
                            disabled={!canManageUsers}
                            title="Thu hồi / xóa quyền tài khoản"
                            className="text-[#94A3B8] transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="h-fit overflow-hidden rounded-2xl bg-[#F1F5F9] shadow-sm">
              <div className="bg-[#0284C7] px-6 py-4 text-white">
                <h3 className="text-base font-black uppercase tracking-wide">{editingUserId !== null ? "Chỉnh sửa tài khoản" : "Cập nhật nhóm quyền"}</h3>
              </div>
              <div className="space-y-4 p-6">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#475569]">Email định danh</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="email"
                      disabled={!canManageUsers}
                      value={newEmail}
                      onChange={(event) => handleEmailChange(event.target.value)}
                      placeholder="name@hcmut.edu.vn"
                      className={`w-full rounded-lg border bg-white px-4 py-3 pl-10 text-sm outline-none focus:ring-2 ${
                        emailError ? "border-red-500 focus:ring-red-500" : "border-[#CBD5E1] focus:ring-[#0284C7]"
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-wider text-[#475569]">Nhóm quyền (role)</label>
                  <select
                    value={newRole}
                    disabled={!canManageUsers}
                    onChange={(event) => handleRoleChange(event.target.value)}
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0284C7]"
                  >
                    <option value="">Chọn nhóm quyền</option>
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
                {emailError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                    <div className="flex gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                      <p className="text-sm font-semibold text-red-600">{emailError}</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  onClick={handleSubmitUser}
                  disabled={!canManageUsers || !!emailError || !newEmail.trim() || !newRole}
                  className="w-full rounded-lg bg-[#0284C7] py-3 font-black text-white transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {editingUserId !== null ? "Lưu thay đổi" : "Xác nhận"}
                </button>
                {editingUserId !== null && (
                  <button
                    type="button"
                    onClick={resetUserForm}
                    className="w-full rounded-lg border border-[#CBD5E1] bg-white py-3 font-black text-[#334155] transition hover:bg-[#F8FAFC]"
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>
            </aside>
          </section>
        )}

        {activeTab === "zones" && (
          <section>
            <h2 className="mb-4 text-xl font-black tracking-tight">
              SƠ ĐỒ BÃI ĐỖ - {selectedZone.name} - Mức sử dụng: {selectedZone.mode === "offline" ? "--" : getUnavailableCount(selectedZone)} / {selectedZone.slots.length} · Còn trống: {getAvailableCount(selectedZone)} / {selectedZone.slots.length}
            </h2>

            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {zones.map((zone) => {
                const unavailableCount = getUnavailableCount(zone);
                const selected = zone.id === selectedZoneId;
                return (
                  <button
                    type="button"
                    key={zone.id}
                    onClick={() => {
                      setSelectedZoneId(zone.id);
                      setSelectedSlots([]);
                    }}
                    className={`min-h-[112px] rounded-2xl border-2 p-4 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${getZoneCardClass(zone, selected)}`}
                  >
                    <p className="text-base font-black leading-tight">{zone.name}</p>
                    <p className="mt-2 text-3xl font-black">{zone.mode === "offline" ? "--" : unavailableCount}/12</p>
                    <p className="mt-1 text-xs font-black uppercase tracking-wide">{getZoneStatusLabel(zone)}</p>
                  </button>
                );
              })}
            </div>

            <div className="mb-8 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[#10B981]"></div>
                <span className="font-semibold text-[#475569]">Trống</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[#94A3B8]"></div>
                <span className="font-semibold text-[#475569]">Có xe</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md bg-[#F59E0B]"></div>
                <span className="font-semibold text-[#475569]">Đã bảo lưu</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded-md border-2 border-[#0369A1] bg-[#0284C7]"></div>
                <span className="font-semibold text-[#0284C7]">Đang chọn</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <div className="rounded-2xl border border-[#CBD5E1] bg-white p-8 shadow-sm">
                  <div className="grid grid-cols-6 gap-3">
                    {selectedZone.slots.map((slot) => {
                      const isSelected = selectedSlots.includes(slot.id);
                      const isPending = pendingSlots.includes(slot.id);
                      const colorClass = getSlotColorClass(slot.status, isSelected, selectedZoneDisabled, isPending);

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => handleToggleSlot(slot.id)}
                          disabled={!canManageZones || selectedZoneDisabled}
                          className={`h-14 rounded-lg text-sm font-black transition-all duration-200 ${colorClass}`}
                        >
                          {slot.id}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-8 flex items-center justify-center gap-2 border-t pt-4 text-[#475569]">
                    <span>⇄ Lối đi xe</span>
                  </div>
                </div>

                {pendingSlots.filter((slotId) => slotId.startsWith(selectedZone.id)).length > 0 && (
                  <div className="mt-6 rounded-xl border border-[#F59E0B]/30 bg-[#FFFBEB] p-6 shadow-sm">
                    <h3 className="mb-3 flex items-center gap-2 text-lg font-black text-[#92400E]">
                      <Clock className="h-5 w-5" />
                      Danh sách ô đang chờ bảo lưu
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {pendingSlots
                        .filter((slotId) => slotId.startsWith(selectedZone.id))
                        .map((slotId) => (
                          <div key={slotId} className="rounded-lg border border-[#F59E0B] bg-[#FEF3C7] px-4 py-2 font-black text-[#92400E] shadow-sm">
                            {slotId}
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              <aside className="h-fit overflow-hidden rounded-2xl bg-[#F1F5F9] shadow-sm">
                <div className="bg-[#0284C7] px-6 py-4 text-center text-white">
                  <h3 className="text-base font-black uppercase tracking-wide">Cấu hình phân vùng</h3>
                </div>

                <div className="p-6">
                  <h4 className="mb-2 text-sm font-black uppercase tracking-wider text-[#475569]">Phân khu đang chọn</h4>
                  <div className="mb-5 rounded-lg border border-[#CBD5E1] bg-white p-3">
                    <p className="font-black text-[#0F172A]">{selectedZone.name}</p>
                    <p className="text-sm font-semibold text-[#64748B]">{selectedZone.type} · {getZoneStatusLabel(selectedZone)}</p>
                  </div>

                  <h4 className="mb-2 text-sm font-black uppercase tracking-wider text-[#475569]">Trạng thái phân khu</h4>
                  <div className="mb-6 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleChangeZoneMode("active")}
                      disabled={!canManageZones}
                      className={`rounded-lg border px-3 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedZone.mode === "active"
                          ? "border-[#10B981] bg-[#10B981] text-white"
                          : "border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      Mở
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeZoneMode("maintenance")}
                      disabled={!canManageZones}
                      className={`rounded-lg border px-3 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedZone.mode === "maintenance"
                          ? "border-[#F59E0B] bg-[#F59E0B] text-white"
                          : "border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      Bảo trì
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChangeZoneMode("offline")}
                      disabled={!canManageZones}
                      className={`rounded-lg border px-3 py-3 text-sm font-black transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        selectedZone.mode === "offline"
                          ? "border-[#94A3B8] bg-[#94A3B8] text-white"
                          : "border-[#CBD5E1] bg-white text-[#334155] hover:bg-[#F8FAFC]"
                      }`}
                    >
                      Mất tín hiệu
                    </button>
                  </div>

                  <h4 className="mb-2 text-sm font-black uppercase tracking-wider text-[#475569]">Các ô đang chọn</h4>
                  <div className="mb-6 min-h-[44px] rounded-lg border border-[#CBD5E1] bg-white p-3">
                    <p className="text-sm font-bold text-[#334155]">
                      {selectedSlots.length > 0 ? selectedSlots.join(", ") : "Chưa chọn ô nào"}
                    </p>
                  </div>

                  <h4 className="mb-2 text-sm font-black uppercase tracking-wider text-[#475569]">Lý do bảo lưu / hủy</h4>
                  <input
                    type="text"
                    disabled={!canManageZones}
                    value={reservationReason}
                    onChange={(event) => setReservationReason(event.target.value)}
                    placeholder="Nhập lý do sự kiện..."
                    className="mb-6 w-full rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#0284C7]"
                  />

                  {hasOccupiedSelected && (
                    <div className="mb-6 rounded-lg border border-[#F59E0B]/40 bg-[#FFFBEB] p-4 shadow-sm">
                      <div className="flex gap-3">
                        <AlertCircle className="h-6 w-6 flex-shrink-0 text-[#D97706]" />
                        <p className="text-sm font-semibold text-[#92400E]">
                          Ô {selectedOccupiedSlots.join(", ")} đang có xe. Lệnh bảo lưu sẽ chuyển sang trạng thái chờ.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleApplyReservation}
                      disabled={!canManageZones || selectedSlots.length === 0 || selectedZoneDisabled}
                      className="w-full rounded-lg bg-[#0284C7] py-3 font-black text-white shadow-sm transition hover:bg-[#0369A1] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Áp dụng bảo lưu
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelReservation}
                      disabled={!canManageZones || selectedSlots.length === 0 || selectedZoneDisabled}
                      className="w-full rounded-lg border border-red-200 bg-white py-3 font-black text-red-600 shadow-sm transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Hủy bảo lưu / Trả ô
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}

      </main>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-4 flex justify-center">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="mb-2 text-center text-xl font-black text-[#0F172A]">Xác nhận vô hiệu chính sách</h2>
            <p className="mb-6 text-center text-[#64748B]">Bạn có chắc muốn vô hiệu hóa chính sách này?</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 font-black text-[#334155] transition hover:bg-[#F8FAFC]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDisablePolicy}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-black text-white transition hover:bg-red-700"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {userDeleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="max-w-md rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-4 flex justify-center">
              <Trash2 className="h-16 w-16 text-red-500" />
            </div>
            <h2 className="mb-2 text-center text-xl font-black text-[#0F172A]">Xác nhận thu hồi quyền</h2>
            <p className="mb-6 text-center text-[#64748B]">
              Bạn có chắc muốn xóa tài khoản này khỏi danh sách phân quyền nội bộ?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setUserDeleteConfirmId(null)}
                className="flex-1 rounded-lg border border-[#CBD5E1] bg-white px-4 py-3 font-black text-[#334155] transition hover:bg-[#F8FAFC]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmDeleteUser}
                className="flex-1 rounded-lg bg-red-600 px-4 py-3 font-black text-white transition hover:bg-red-700"
              >
                Xóa quyền
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

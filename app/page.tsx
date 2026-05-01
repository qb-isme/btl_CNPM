"use client"

import React, { useState, useEffect } from 'react';
import { 
  Settings, Users, Map, Shield, CreditCard, 
  Plus, Search, CheckCircle2, XCircle, 
  Clock, Car, Bike, Save, X,
  AlertCircle, Edit2, Trash2, Lock
} from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// --- MOCK DATA ---
const INITIAL_POLICIES = [
  { id: 1, name: "Sinh viên nhà trường", group: "Sinh viên", price: 2000, vehicle: "Xe máy", block: "Xe máy", status: true },
  { id: 2, name: "Cán bộ / Giảng viên", group: "Giảng viên", price: 0, vehicle: "Xe máy", block: "Xe máy", status: true },
  { id: 3, name: "Giảng viên đi ô tô", group: "Giảng viên", price: 10000, vehicle: "ô tô", block: "ô tô", status: true },
  { id: 4, name: "Khách vãng lai", group: "Khách", price: 5000, vehicle: "Xe máy", block: "Xe máy", status: true },
];

const INITIAL_USERS = [
  { id: 1, name: "Nguyễn Văn Hành", email: "nhanvien01@hcmut.edu.vn", role: "Nhân viên vận hành", active: true },
  { id: 2, name: "Kỹ Thuật Viên", email: "kythuatvien@hcmut.edu.vn", role: "Kỹ thuật viên", active: true },
  { id: 3, name: "Admin", email: "admin@hcmut.edu.vn", role: "Quản trị hệ thống", active: true },
];

// Hàm tạo trạng thái bãi đỗ random trộn lẫn Trống (empty) và Có xe (occupied)
const generateRandomSlots = () => {
  const rows = ['A', 'B', 'C', 'D'];
  const newSlots = [];
  // Hardcode random pattern to avoid SSR hydration mismatch
  const randomPattern = [
    'empty', 'empty', 'occupied', 'empty', 'occupied', 'empty', 'empty', 'empty', 'occupied', 'empty', 'empty', 'empty',
    'occupied', 'empty', 'empty', 'empty', 'empty', 'occupied', 'empty', 'occupied', 'empty', 'empty', 'empty', 'occupied',
    'empty', 'occupied', 'empty', 'empty', 'empty', 'empty', 'empty', 'empty', 'occupied', 'empty', 'empty', 'empty',
    'empty', 'empty', 'occupied', 'occupied', 'empty', 'empty', 'empty', 'empty', 'empty', 'occupied', 'empty', 'empty'
  ];
  let i = 0;
  for (const row of rows) {
    for (let num = 1; num <= 12; num++) {
      newSlots.push({ id: `${row}${num}`, status: randomPattern[i] });
      i++;
    }
  }
  return newSlots;
};

const INITIAL_SLOTS = generateRandomSlots();

export default function SettingsPage() {
  const [policies, setPolicies] = useState(INITIAL_POLICIES);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [slots, setSlots] = useState(INITIAL_SLOTS);
  
  // Trạng thái cho việc chọn và bảo lưu ô
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [pendingSlots, setPendingSlots] = useState<string[]>([]); // Danh sách ô chờ bảo lưu
  
  const [searchTerm, setSearchTerm] = useState("");
  const [priceError, setPriceError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [disabledPolicies, setDisabledPolicies] = useState<number[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("");
  const [activeTab, setActiveTab] = useState("pricing");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  // Header config based on active tab
  const getHeaderConfig = () => {
    const config = {
      pricing: {
        title: "TRANG QUẢN TRỊ - QUẢN LÝ CHÍNH SÁCH",
        avatarName: "Ban Quản Lý",
        avatarUrl: "/avatar-admin.jpg"
      },
      users: {
        title: "TRANG QUẢN TRỊ - QUẢN LÝ PHÂN QUYỀN & TÀI KHOẢN NỘI BỘ",
        avatarName: "IT (Quản trị hệ thống)",
        avatarUrl: "/avatar-admin.jpg"
      },
      zones: {
        title: "TRANG QUẢN TRỊ - BẢN ĐỒ KHÔNG GIAN BÃI ĐỖ",
        avatarName: "Nhân viên Vận hành (Bảo vệ)",
        avatarUrl: "/avatar-security.jpg"
      }
    };
    return config[activeTab as keyof typeof config] || config.pricing;
  };

  const headerConfig = getHeaderConfig();

  // ----- HANDLERS CHO TAB 6.1 & 6.2 -----
  const handlePriceChange = (value: string) => {
    setNewPrice(value);
    if (value && parseFloat(value) < 0) {
      setPriceError("Giá trị không hợp lệ (Giá phải >= 0)");
    } else {
      setPriceError("");
    }
  };

  const handleEmailChange = (value: string) => {
    setNewEmail(value);
    const emailExists = users.some(u => u.email.toLowerCase() === value.toLowerCase());
    if (emailExists) {
      setEmailError("Tài khoản này đã có quyền hạn vừa được nhập!");
    } else {
      setEmailError("");
    }
  };

  const handleRoleChange = (value: string) => {
    setNewRole(value);
    if (newEmail) {
      const duplicate = users.some(u => 
        u.email.toLowerCase() === newEmail.toLowerCase() && u.role === value
      );
      if (duplicate) {
        setEmailError("Tài khoản này đã có quyền hạn vừa được nhập!");
      } else {
        setEmailError("");
      }
    }
  };

  const handleDisablePolicy = (policyId: number) => {
    setShowConfirmModal(policyId);
  };

  const confirmDisablePolicy = () => {
    if (showConfirmModal) {
      setDisabledPolicies([...disabledPolicies, showConfirmModal]);
      setShowConfirmModal(null);
    }
  };

  // ----- HANDLERS CHO TAB 6.3 (QUẢN LÝ BÃI ĐỖ) -----
  
  // Xử lý khi click vào 1 ô đỗ (Chọn/Bỏ chọn)
  const handleToggleSlot = (id: string) => {
    setSelectedSlots(prev => 
      prev.includes(id) 
        ? prev.filter(slotId => slotId !== id) // Click lần 2: Bỏ chọn, trả về ban đầu
        : [...prev, id] // Click lần 1: Đưa vào mảng đang chọn
    );
  };

  // Xử lý Áp dụng bảo lưu
  const handleApplyReservation = () => {
    if (selectedSlots.length === 0) return;
    
    const newSlots = [...slots];
    const newPending = [...pendingSlots];

    selectedSlots.forEach(id => {
      const slotIndex = newSlots.findIndex(s => s.id === id);
      if (slotIndex !== -1) {
        const slot = newSlots[slotIndex];
        if (slot.status === 'empty') {
          // Ô trống -> Đổi sang Bảo lưu (Vàng)
          newSlots[slotIndex] = { ...slot, status: 'reserved' };
        } else if (slot.status === 'occupied') {
          // Ô đang có xe -> Giữ màu xám, thêm vào danh sách Pending
          if (!newPending.includes(id)) {
            newPending.push(id);
          }
        }
      }
    });

    setSlots(newSlots);
    setPendingSlots(newPending);
    setSelectedSlots([]); // Reset vùng chọn sau khi áp dụng
  };

  // Xử lý Hủy bảo lưu (Trả về trạng thái trống)
  const handleCancelReservation = () => {
    if (selectedSlots.length === 0) return;
    
    const newSlots = [...slots];
    let newPending = [...pendingSlots];

    selectedSlots.forEach(id => {
      const slotIndex = newSlots.findIndex(s => s.id === id);
      if (slotIndex !== -1) {
        const slot = newSlots[slotIndex];
        if (slot.status === 'reserved') {
          // Trả ô bảo lưu (vàng) về trống (xanh lá)
          newSlots[slotIndex] = { ...slot, status: 'empty' };
        }
      }
      // Đồng thời gỡ khỏi danh sách chờ bảo lưu nếu có
      newPending = newPending.filter(pId => pId !== id);
    });

    setSlots(newSlots);
    setPendingSlots(newPending);
    setSelectedSlots([]);
  };

  // Lọc ra các ô "Đang có xe" nằm trong danh sách đang được chọn để hiện cảnh báo
  const selectedOccupiedSlots = selectedSlots.filter(id => {
    const slot = slots.find(s => s.id === id);
    return slot?.status === 'occupied';
  });
  const hasOccupiedSelected = selectedOccupiedSlots.length > 0;

  // Đếm thống kê
  const occupiedCount = slots.filter(s => s.status === 'occupied').length;
  const reservedCount = slots.filter(s => s.status === 'reserved').length;
  const emptyCount = slots.filter(s => s.status === 'empty').length;
  const totalCapacity = slots.length;

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gray-200 px-8 py-6 flex items-center justify-between border-b">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-black">Hệ Thống Quản Lý Bãi Xe</h1>
          <p className="text-sm text-gray-600">{headerConfig.title}</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="bg-white rounded-full px-6 py-2 text-center">
            <div className="text-xl font-semibold text-gray-800">{formatTime(currentTime)}</div>
          </div>
          
          <div className="bg-green-100 rounded-full px-6 py-2 text-center">
            <div className="text-lg font-semibold text-green-700">Online</div>
          </div>
          
          <div className="flex items-center gap-3">
            <img src={headerConfig.avatarUrl} alt={headerConfig.avatarName} className="w-10 h-10 rounded-full object-cover bg-blue-100" />
            <div className="text-sm">
              <div className="font-semibold text-black">{headerConfig.avatarName}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 max-w-[1600px] mx-auto">
        <Tabs defaultValue="pricing" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 bg-white border-b p-0 mb-8 h-auto rounded-none">
            <TabsTrigger value="pricing" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-3 text-base font-semibold">
              Quản Lý Chính Sách
            </TabsTrigger>
            <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-3 text-base font-semibold">
              Quản Lý Phân Quyền
            </TabsTrigger>
            <TabsTrigger value="zones" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-3 text-base font-semibold">
              Quản Lý Bãi Đỗ
            </TabsTrigger>
          </TabsList>

          {/* ===== TAB 6.1: ĐỊNH GIÁ ===== */}
          <TabsContent value="pricing" className="animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <h2 className="text-xl font-bold mb-4">Danh sách chính sách đang áp dụng</h2>
                <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Tên chính sách</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Nhóm đối tượng</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Mức giá (VNĐ)</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Phương tiện</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {policies.map((p) => (
                        <tr key={p.id} className={`border-b hover:bg-gray-50 ${disabledPolicies.includes(p.id) ? 'bg-red-50' : ''}`}>
                          <td className="px-6 py-4 font-medium text-gray-900">{p.name}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                              {p.group}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-blue-600">{p.price > 0 ? `${p.price.toLocaleString()}` : "Miễn phí"}</td>
                          <td className="px-6 py-4 text-gray-600">{p.vehicle}</td>
                          <td className="px-6 py-4">
                            <button 
                              onClick={() => handleDisablePolicy(p.id)}
                              className="px-4 py-1.5 bg-red-100 text-red-600 rounded-lg text-sm font-semibold hover:bg-red-200"
                            >
                              Vô hiệu
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-100 rounded-2xl overflow-hidden h-fit sticky top-24">
                <div className="bg-blue-600 text-white px-6 py-4">
                  <h3 className="text-base font-bold uppercase tracking-wide">Thiết lập chính sách mới</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Tên chính sách</label>
                    <input type="text" placeholder="Nhập tên chính sách..." className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Nhóm đối tượng</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Chọn nhóm</option>
                      <option>Sinh viên</option>
                      <option>Cán bộ / GV</option>
                      <option>Khách vãng lai</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Mức giá (VNĐ)</label>
                    <input 
                      type="number" 
                      value={newPrice}
                      onChange={(e) => handlePriceChange(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${priceError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} 
                    />
                    {priceError && <p className="text-red-600 text-sm mt-1">{priceError}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-2">Phương tiện</label>
                    <select className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Chọn phương tiện</option>
                      <option>Xe máy</option>
                      <option>Ô tô</option>
                    </select>
                  </div>
                  <button 
                    disabled={!!priceError}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Lưu và ban hành
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 6.2: PHÂN QUYỀN ===== */}
          <TabsContent value="users" className="animate-in fade-in-50 duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <div className="xl:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">Tài khoản nội bộ</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      placeholder="Tìm theo email..." 
                      className="pl-9 w-80 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="bg-white border border-gray-300 rounded-2xl overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Email định danh</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Nhóm quyền (Role)</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Trạng thái</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{u.email}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">{u.role}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full bg-green-500"></div>
                              <span className="text-sm text-green-600 font-medium">Active</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <button className="text-gray-400 hover:text-gray-600 mr-3"><Edit2 className="w-4 h-4" /></button>
                            <button className="text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-gray-100 rounded-2xl overflow-hidden h-fit sticky top-24">
                <div className="bg-blue-600 text-white px-6 py-4">
                  <h3 className="text-base font-bold uppercase tracking-wide">Cập nhật nhóm quyền</h3>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Email định danh</label>
                    <input 
                      type="email" 
                      value={newEmail}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      className={`w-full px-4 py-2 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Nhóm quyền (role)</label>
                    <select 
                      value={newRole}
                      onChange={(e) => handleRoleChange(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Chọn nhóm quyền</option>
                      <option value="Quản trị hệ thống">Quản trị hệ thống</option>
                      <option value="Nhân viên vận hành">Nhân viên vận hành</option>
                      <option value="Kỹ thuật viên">Kỹ thuật viên</option>
                    </select>
                  </div>
                  {emailError && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <div className="flex gap-2">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-red-600 text-sm">{emailError}</p>
                      </div>
                    </div>
                  )}
                  <button 
                    disabled={!!emailError}
                    className="w-full bg-blue-500 text-white py-3 rounded-lg font-bold hover:bg-blue-600 transition mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Xác nhận
                  </button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ===== TAB 6.3: BÃI ĐỖ ===== */}
          <TabsContent value="zones" className="animate-in fade-in-50 duration-500">
            <div>
              <h2 className="text-xl font-bold mb-6">
                SƠ ĐỒ BÃI ĐỖ (Khu vực cổng chính) - Sức chứa khả dụng: {totalCapacity - reservedCount} / {totalCapacity}
              </h2>
              
              <div className="flex gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-green-500"></div>
                  <span className="font-medium text-gray-600">Trống</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-gray-400"></div>
                  <span className="font-medium text-gray-600">Có xe</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-yellow-400"></div>
                  <span className="font-medium text-gray-600">Đã bảo lưu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-blue-500 border-2 border-blue-600"></div>
                  <span className="font-medium text-blue-600">Đang chọn</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LƯỚI BÃI ĐỖ */}
                <div className="lg:col-span-2">
                  <div className="bg-white border border-gray-300 rounded-2xl p-8">
                    <div className="space-y-4">
                      {['A', 'B', 'C', 'D'].map((row) => (
                        <div key={row} className="grid grid-cols-12 gap-2">
                          {slots.filter(s => s.id.startsWith(row)).map((slot) => {
                            // Render logic màu sắc ô đỗ
                            const isSelected = selectedSlots.includes(slot.id);
                            
                            let bgColorClass = '';
                            if (isSelected) {
                              bgColorClass = 'bg-blue-500 text-white shadow-md transform scale-105 border border-blue-600'; // Đang chọn
                            } else if (slot.status === 'empty') {
                              bgColorClass = 'bg-green-500 text-white hover:bg-green-600'; // Trống
                            } else if (slot.status === 'occupied') {
                              bgColorClass = 'bg-gray-400 text-white hover:bg-gray-500'; // Có xe
                            } else if (slot.status === 'reserved') {
                              bgColorClass = 'bg-yellow-400 text-white hover:bg-yellow-500'; // Đã bảo lưu
                            }

                            return (
                              <button
                                key={slot.id}
                                onClick={() => handleToggleSlot(slot.id)}
                                className={`h-12 rounded-lg font-bold text-sm transition-all duration-200 ${bgColorClass}`}
                              >
                                {slot.id}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-center gap-2 mt-8 text-gray-600 border-t pt-4">
                      <span>⇄ Lối đi xe</span>
                    </div>
                  </div>

                  {/* THANH CHỜ BẢO LƯU (Mới tạo) */}
                  {pendingSlots.length > 0 && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-bold mb-3 text-yellow-800 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        Danh sách ô đang "Chờ bảo lưu"
                      </h3>
                      <p className="text-sm text-yellow-700 mb-4">Các ô này hiện đang có xe đậu nhưng đã được lệnh bảo lưu. Hệ thống sẽ tự động khóa và chuyển sang màu Vàng ngay khi xe rời đi.</p>
                      
                      <div className="flex flex-wrap gap-2">
                        {pendingSlots.map(id => (
                          <div key={id} className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-2 rounded-lg font-bold shadow-sm">
                            {id}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* MENU THAO TÁC CỘT PHẢI */}
                <div className="bg-gray-100 rounded-2xl overflow-hidden h-fit shadow-sm">
                  <div className="bg-blue-600 text-white px-6 py-4 text-center">
                    <h3 className="text-base font-bold uppercase tracking-wide">Cấu hình phân vùng</h3>
                  </div>

                  <div className="p-6">
                    <h4 className="text-sm font-bold text-gray-800 mb-2 uppercase tracking-wider">Các ô đang chọn</h4>
                    <div className="bg-white p-3 rounded-lg border border-gray-300 min-h-[44px] mb-6">
                      <p className="text-sm font-semibold text-gray-700">
                        {selectedSlots.length > 0 ? selectedSlots.join(', ') : 'Chưa chọn ô nào'}
                      </p>
                    </div>
                    
                    <h4 className="font-bold text-gray-800 mb-2 text-sm uppercase tracking-wider">Lý do bảo lưu / hủy</h4>
                    <input 
                      type="text" 
                      placeholder="Nhập lý do sự kiện..." 
                      className="w-full px-4 py-3 mb-6 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    {/* HIỂN THỊ CẢNH BÁO NẾU CHỌN TRÚNG Ô CÓ XE */}
                    {hasOccupiedSelected && (
                      <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6 shadow-sm">
                        <div className="flex gap-3">
                          <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                          <p className="text-yellow-800 text-sm font-medium">
                            <span className="font-bold block mb-1">Lưu ý hệ thống:</span> 
                            Ô <span className="font-bold text-red-600">{selectedOccupiedSlots.join(', ')}</span> đang có xe đậu. Hệ thống sẽ kích hoạt trạng thái <b>'Chờ bảo lưu'</b> thay vì khóa ngay, và tự động chuyển sang màu vàng ngay khi xe rời đi.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <button 
                        onClick={handleApplyReservation}
                        disabled={selectedSlots.length === 0}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        Áp dụng bảo lưu
                      </button>
                      <button 
                        onClick={handleCancelReservation}
                        disabled={selectedSlots.length === 0}
                        className="w-full bg-white text-red-600 py-3 rounded-lg font-bold border border-red-200 hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        Hủy bảo lưu / Trả ô
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-center text-xl font-bold mb-2 text-gray-900">Xác nhận vô hiệu chính sách</h2>
            <p className="text-center text-gray-600 mb-6">Bạn có chắc muốn vô hiệu hóa chính sách này? Hành động này không thể hoàn tác.</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 px-4 py-3 bg-white text-gray-700 rounded-lg font-bold border border-gray-300 hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button 
                onClick={confirmDisablePolicy}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700"
              >
                Đồng ý, vô hiệu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
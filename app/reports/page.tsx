"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/parking/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { AlertCircle, Download, FileSpreadsheet, RefreshCcw } from "lucide-react";
import { toast } from "sonner";

// --- MOCK DATA CHO UC 7.2 (ĐỐI SOÁT BKPAY) ---
const reconciliationData = [
  { id: "TX1001", time: "2024-05-20 08:30", amount: 5000, internal: "Thành công", bkpay: "Thành công", status: "match" },
  { id: "TX1002", time: "2024-05-20 09:15", amount: 10000, internal: "Thành công", bkpay: "Thành công", status: "match" },
  { id: "TX1003", time: "2024-05-20 10:00", amount: 5000, internal: "Thành công", bkpay: "Chưa thanh toán", status: "mismatch" },
  { id: "TX1004", time: "2024-05-20 10:45", amount: 20000, internal: "Thành công", bkpay: "Thành công", status: "match" },
  { id: "TX1005", time: "2024-05-20 11:20", amount: 5000, internal: "Lỗi hệ thống", bkpay: "Thành công", status: "mismatch" },
];

// --- MOCK DATA CHO UC 7.1 (HEATMAP/MẬT ĐỘ) ---
const heatmapData = [
  { hour: "07:00", occupancy: 45, color: "#22c55e" },
  { hour: "08:00", occupancy: 85, color: "#eab308" },
  { hour: "09:00", occupancy: 98, color: "#ef4444" },
  { hour: "10:00", occupancy: 95, color: "#ef4444" },
  { hour: "11:00", occupancy: 70, color: "#eab308" },
  { hour: "12:00", occupancy: 60, color: "#22c55e" },
  { hour: "13:00", occupancy: 80, color: "#eab308" },
  { hour: "14:00", occupancy: 92, color: "#ef4444" },
];

type StoredUser = {
  name?: string;
  role?: string;
  username?: string;
};

const canAccessReports = (role?: string) => {
  return role === "Ban quản lý" || role === "Admin" || role === "Quản lý";
};

export default function ReportsPage() {
  const router = useRouter();
  const [isReconciling, setIsReconciling] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/");
      return;
    }

    try {
      const user: StoredUser = JSON.parse(storedUser);

      if (!canAccessReports(user.role)) {
        toast.error("Bạn không có quyền truy cập Báo cáo & Phân tích");
        router.push("/map");
        return;
      }

      setIsAuthorized(true);
    } catch {
      localStorage.removeItem("user");
      router.push("/");
    }
  }, [router]);

  // Xử lý nút đối soát tức thời (Alternative Flow A1)
  const handleInstantReconcile = () => {
    setIsReconciling(true);
    toast.info("Hệ thống đang tiến hành đối soát ngầm với BKPay...");

    setTimeout(() => {
      setIsReconciling(false);
      toast.success("Đối soát hoàn tất! Vui lòng kiểm tra tab Lịch sử.");
    }, 2000);
  };

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B]">
        <Header />
        <div className="p-6 text-sm text-slate-500">Đang kiểm tra quyền truy cập...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#1E293B]">
      <Header />

      <main className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight">Báo cáo & Phân tích</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => toast.success("Đang xuất file PDF...")}>
              <Download className="mr-2 h-4 w-4" /> Xuất PDF
            </Button>
            <Button onClick={() => toast.success("Đang xuất file Excel...")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Xuất Excel
            </Button>
          </div>
        </div>

        <Tabs defaultValue="heatmap" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="heatmap">Biểu đồ nhiệt lấp đầy</TabsTrigger>
            <TabsTrigger value="reconciliation">Đối soát BKPay</TabsTrigger>
          </TabsList>

          {/* --- PHÂN HỆ UC 7.1: BIỂU ĐỒ NHIỆT --- */}
          <TabsContent value="heatmap" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Tỷ lệ lấp đầy TB</CardTitle>
                  <CardTitle className="text-2xl font-bold">78.5%</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Giờ cao điểm</CardTitle>
                  <CardTitle className="text-2xl font-bold text-red-500">09:00 - 10:30</CardTitle>
                </CardHeader>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Khu vực mật độ cao</CardTitle>
                  <CardTitle className="text-2xl font-bold">Khu A</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Phân tích mật độ đỗ xe theo thời gian</CardTitle>
                <CardDescription>Dữ liệu tổng hợp từ cảm biến IoT (Xanh: Thưa - Đỏ: Kín)</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={heatmapData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="hour" />
                    <YAxis unit="%" />
                    <Tooltip
                      formatter={(value) => [`${value}% lấp đầy`, "Trạng thái"]}
                      contentStyle={{ borderRadius: "8px" }}
                    />
                    <Bar dataKey="occupancy" radius={[4, 4, 0, 0]}>
                      {heatmapData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* --- PHÂN HỆ UC 7.2: ĐỐI SOÁT BKPAY --- */}
          <TabsContent value="reconciliation" className="space-y-4">
            <div className="flex justify-between items-end gap-4 bg-muted/50 p-4 rounded-lg">
              <div className="flex gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Khoảng thời gian</label>
                  <Select defaultValue="today">
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Chọn ngày" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Hôm nay</SelectItem>
                      <SelectItem value="yesterday">Hôm qua</SelectItem>
                      <SelectItem value="week">Tuần này</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button
                variant="secondary"
                onClick={handleInstantReconcile}
                disabled={isReconciling}
              >
                <RefreshCcw className={`mr-2 h-4 w-4 ${isReconciling ? "animate-spin" : ""}`} />
                Đối soát tức thời
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold">45.000đ</div>
                  <p className="text-xs text-muted-foreground">Tổng doanh thu</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <p className="text-xs text-muted-foreground">Giao dịch khớp</p>
                </CardContent>
              </Card>
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold text-red-600">2</div>
                  <p className="text-xs text-muted-foreground">Giao dịch lệch</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6 text-center">
                  <div className="text-2xl font-bold">Khớp 60%</div>
                  <p className="text-xs text-muted-foreground">Trạng thái kỳ này</p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Chi tiết đối soát giao dịch</CardTitle>
                <CardDescription>So sánh dữ liệu Smart Parking và Cổng thanh toán BKPay</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mã GD</TableHead>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Số tiền</TableHead>
                      <TableHead>Hệ thống nội bộ</TableHead>
                      <TableHead>Cổng BKPay</TableHead>
                      <TableHead>Kết quả</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reconciliationData.map((row) => (
                      <TableRow key={row.id} className={row.status === "mismatch" ? "bg-red-50" : ""}>
                        <TableCell className="font-medium">{row.id}</TableCell>
                        <TableCell>{row.time}</TableCell>
                        <TableCell>{row.amount.toLocaleString()}đ</TableCell>
                        <TableCell>
                          <Badge variant={row.internal === "Thành công" ? "outline" : "destructive"}>
                            {row.internal}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={row.bkpay === "Thành công" ? "outline" : "destructive"}>
                            {row.bkpay}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.status === "match" ? (
                            <Badge className="bg-green-500 text-white border-none">Khớp</Badge>
                          ) : (
                            <div className="flex items-center text-red-600 font-bold gap-1">
                              <AlertCircle size={14} /> Sai lệch
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.status === "mismatch" && (
                            <Button size="sm" variant="ghost" onClick={() => toast.error("Đã gửi yêu cầu kiểm tra thủ công")}>
                              Xử lý
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

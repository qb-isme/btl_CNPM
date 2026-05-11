"use client"

import { ChevronDown, CheckCircle, AlertTriangle, AlertCircle, User } from "lucide-react"

type ExitStatus = "valid" | "security-warning" | "card-error" | "offline"
type CustomerType = "visitor" | "internal"

interface ExitCustomerInfoProps {
  status: ExitStatus
  cardId: string
  customerType: CustomerType
  customerName?: string
  fee?: number
  onConfirmExit: () => void
  onReportLostCard: () => void
  onCallSupport: () => void
}

export function ExitCustomerInfo({
  status,
  cardId,
  customerType,
  customerName = "",
  fee,
  onConfirmExit,
  onReportLostCard,
  onCallSupport,
}: ExitCustomerInfoProps) {
  // Fee is 0 for internal customers, 2000 for visitors
  const actualFee = customerType === "internal" ? 0 : (fee ?? 2000)

  const getStatusBanner = () => {
    switch (status) {
      case "valid":
        return (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-green-200 bg-green-50 px-5 py-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <p className="font-bold text-green-700">HỢP LỆ</p>
              <p className="text-sm text-green-600">Dữ liệu khớp. Sẵn sàng mở rào.</p>
            </div>
          </div>
        )
      case "security-warning":
        return (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <div>
              <p className="font-bold text-red-700">CẢNH BÁO AN NINH</p>
              <p className="text-sm text-red-600">Sai biển số! Tự động khóa làn</p>
            </div>
          </div>
        )
      case "card-error":
        return (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-red-200 bg-red-50 px-5 py-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <p className="font-bold text-red-700">LỖI THẺ</p>
              <p className="text-sm text-red-600">Không có dữ liệu</p>
            </div>
          </div>
        )
      case "offline":
        return (
          <div className="flex items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 px-5 py-4">
            <AlertCircle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="font-bold text-amber-700">CHẾ ĐỘ NGOẠI TUYẾN</p>
              <p className="text-sm text-amber-600">Đang sử dụng dữ liệu Cache.</p>
            </div>
          </div>
        )
    }
  }

  const getCustomerTypeLabel = (type: CustomerType) => {
    return type === "visitor" ? "Khách vãng lai" : "NỘI BỘ (SINH..."
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Status Banner */}
      {getStatusBanner()}

      {/* Customer Info Card */}
      <div className="rounded-2xl border-2 border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-center text-xl font-bold text-slate-800">THÔNG TIN KHÁCH HÀNG</h3>
        
        {/* Card ID */}
        <div className="mb-4">
          <label className="mb-1 block text-sm text-slate-600">Mã thẻ</label>
          <div className={`rounded-xl border-2 px-4 py-3 text-center text-xl font-semibold ${
            status === "card-error" 
              ? "border-red-300 bg-red-50 text-red-600" 
              : "border-slate-200 bg-slate-50 text-slate-800"
          }`}>
            {cardId}
          </div>
        </div>

        {/* Customer Name and Type - Layout depends on customer type */}
        {status !== "card-error" && (
          <>
            {/* For internal customers: show both Name and Type side by side */}
            {customerType === "internal" && (
              <div className="mb-4 flex gap-3">
                {/* Customer Name */}
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-slate-600">Họ và tên</label>
                  <div className="flex h-[52px] items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-lg font-semibold text-slate-800">
                    {customerName || "NGUYỄN VĂN A"}
                  </div>
                </div>

                {/* Customer Type */}
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-slate-600">Loại khách</label>
                  <div className="flex h-[52px] w-full items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-50 px-3 text-lg font-semibold text-blue-600">
                    <span className="truncate">{getCustomerTypeLabel(customerType)}</span>
                    <ChevronDown className="ml-1 h-5 w-5 flex-shrink-0" />
                  </div>
                </div>
              </div>
            )}

            {/* For visitors: show only Customer Type dropdown */}
            {customerType === "visitor" && (
              <div className="mb-4">
                <label className="mb-1 block text-sm text-slate-600">Loại khách</label>
                <div className="flex h-[52px] w-full items-center justify-center rounded-xl border-2 border-blue-200 bg-blue-50 px-3 text-lg font-semibold text-blue-600">
                  <span>{getCustomerTypeLabel(customerType)}</span>
                  <ChevronDown className="ml-1 h-5 w-5 flex-shrink-0" />
                </div>
              </div>
            )}
          </>
        )}

        {/* No Session Found - Only for card error */}
        {status === "card-error" && (
          <div className="mb-4 flex flex-col items-center justify-center rounded-xl border-2 border-slate-200 bg-slate-50 py-8 text-slate-400">
            <User className="mb-2 h-12 w-12" />
            <p>Không tìm thấy phiên gửi xe</p>
          </div>
        )}

        {/* Fee Card - Different for visitor vs internal */}
        {status !== "card-error" && (
          <div className="mb-4 overflow-hidden rounded-xl bg-gradient-to-r from-slate-700 to-slate-900 p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-slate-300">Phí dịch vụ</p>
            <div className="flex items-baseline justify-between">
              <p className="text-4xl font-bold">
                {actualFee.toLocaleString()}<span className="text-lg">VNĐ</span>
              </p>
              <p className="text-xs text-slate-400">
                {customerType === "internal" ? "Tự động ghi nợ" : "Thanh toán trực tiếp"}
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <button
          onClick={onConfirmExit}
          className={`mb-3 w-full rounded-xl py-4 text-lg font-bold text-white transition-colors ${
            status === "security-warning"
              ? "bg-slate-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={status === "security-warning"}
        >
          XÁC NHẬN CHO RA
        </button>

        <div className="flex gap-3">
          <button
            onClick={onReportLostCard}
            className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            BÁO MẤT THẺ
          </button>
          <button
            onClick={onCallSupport}
            className="flex-1 rounded-xl border-2 border-slate-200 bg-white py-3 font-semibold text-slate-600 transition-colors hover:bg-slate-50"
          >
            GỌI HỖ TRỢ
          </button>
        </div>
      </div>
    </div>
  )
}

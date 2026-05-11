import { ChevronDown } from "lucide-react"

type FormStatus = "normal" | "error" | "error-locked" | "parking-full" | "offline-warning"
type CustomerType = "visitor" | "internal"

interface CardProcessingProps {
  formStatus: FormStatus
  cardId: string
  customerType: CustomerType
  fullName: string
  employeeId: string
  onCardIdChange: (value: string) => void
  onCustomerTypeChange: (value: CustomerType) => void
  onFullNameChange: (value: string) => void
  onEmployeeIdChange: (value: string) => void
  onCreateSession: () => void
  onRefresh: () => void
  isOffline?: boolean
}

export function CardProcessing({
  formStatus,
  cardId,
  customerType,
  fullName,
  employeeId,
  onCardIdChange,
  onCustomerTypeChange,
  onFullNameChange,
  onEmployeeIdChange,
  onCreateSession,
  onRefresh,
  isOffline = false,
}: CardProcessingProps) {
  const getTitle = () => (formStatus === "parking-full" ? "THÔNG BÁO - BÃI ĐẦY" : "XỬ LÝ QUẸT THẺ")

  const getErrorMessage = () => {
    switch (formStatus) {
      case "error":
        return "Thẻ tạm này đang được sử dụng (chưa đóng phiên cũ)."
      case "error-locked":
        return "Thẻ không hợp lệ hoặc tài khoản bị khóa!"
      case "offline-warning":
        return "Đang dùng danh sách đen cục bộ. Dữ liệu sẽ đồng bộ sau."
      default:
        return null
    }
  }

  const isError = formStatus === "error" || formStatus === "error-locked"
  const isWarning = formStatus === "offline-warning"
  const isOfflineMode = isOffline || formStatus === "offline-warning"

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-center text-2xl font-bold text-slate-800">{getTitle()}</h2>

      {(isError || isWarning) && (
        <div className={`rounded-xl border px-4 py-2 text-center text-sm ${isWarning ? "border-amber-300 bg-amber-50 text-amber-700" : "border-red-300 bg-red-50 text-red-600"}`}>
          {isWarning && <span className="mr-1">⚠</span>}
          {getErrorMessage()}
        </div>
      )}

      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">Mã thẻ</label>
        <input
          type="text"
          value={cardId}
          onChange={(e) => onCardIdChange(e.target.value)}
          className={`rounded-xl border-2 px-4 py-3 text-center text-xl font-semibold transition-colors ${
            isError ? "border-red-400 bg-red-50 text-red-600" : "border-slate-200 bg-slate-50 text-slate-800 focus:border-blue-400 focus:outline-none"
          }`}
          placeholder="0123456789"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">Loại khách</label>
        <div className="relative">
          <select
            value={customerType}
            onChange={(e) => onCustomerTypeChange(e.target.value as CustomerType)}
            className="w-full appearance-none rounded-xl border-2 border-blue-200 bg-blue-50 px-4 py-3 text-center text-lg font-semibold text-blue-600 focus:border-blue-400 focus:outline-none"
          >
            <option value="visitor">Khách vãng lai</option>
            <option value="internal">Nội bộ (Sinh viên/ Giảng viên)</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-blue-600" />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">Họ và tên</label>
        <input
          type="text"
          value={isOfflineMode && !fullName ? "" : fullName}
          onChange={(e) => onFullNameChange(e.target.value)}
          className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center text-slate-800 focus:border-blue-400 focus:outline-none"
          placeholder={isOfflineMode ? "Không thể tải" : ""}
          disabled={isOfflineMode && formStatus === "offline-warning"}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm text-slate-600">MSSV / Mã nhân viên</label>
        <input
          type="text"
          value={isOfflineMode && !employeeId ? "" : employeeId}
          onChange={(e) => onEmployeeIdChange(e.target.value)}
          className="rounded-xl border-2 border-slate-200 bg-slate-50 px-4 py-3 text-center text-slate-800 focus:border-blue-400 focus:outline-none"
          placeholder={isOfflineMode ? "Không thể tải" : ""}
          disabled={isOfflineMode && formStatus === "offline-warning"}
        />
      </div>

      <div className="mt-2 flex gap-4">
        <button onClick={onCreateSession} className="flex-1 rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white transition-colors hover:bg-blue-700">
          {isOffline ? (
            <span>
              Tạo phiên
              <br />
              (OFFLINE)
            </span>
          ) : (
            "Tạo phiên"
          )}
        </button>
        <button
          onClick={onRefresh}
          className="flex-1 rounded-xl border-2 border-slate-200 bg-white px-6 py-4 font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          Làm mới
        </button>
      </div>
    </div>
  )
}

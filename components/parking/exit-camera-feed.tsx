"use client"

import { Camera, Edit3 } from "lucide-react"

type ExitStatus = "valid" | "security-warning" | "card-error" | "offline"

interface ExitCameraFeedProps {
  currentPlate?: string
  originalPlate?: string
  entryTime?: string
  status: ExitStatus
  onManualEntry: () => void
  isManualEntryMode?: boolean
  manualPlateInput?: string
  onManualPlateChange?: (value: string) => void
  onManualPlateConfirm?: () => void
}

export function ExitCameraFeed({
  currentPlate = "51H-987.65",
  originalPlate = "51H-987.65",
  entryTime = "10:24 AM",
  status,
  onManualEntry,
  isManualEntryMode = false,
  manualPlateInput = "",
  onManualPlateChange,
  onManualPlateConfirm,
}: ExitCameraFeedProps) {
  const hasError = status === "security-warning" || status === "card-error"
  
  const formatPlateDisplay = (plate: string) => {
    const parts = plate.split("-")
    if (parts.length === 2) {
      return (
        <>
          <span>{parts[0]}-</span>
          <br />
          <span>{parts[1]}</span>
        </>
      )
    }
    return plate
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Current Camera Section */}
      <div className={`rounded-2xl border-2 p-4 ${hasError ? "border-red-400" : "border-slate-200"} bg-white`}>
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <Camera className="h-4 w-4" />
          <span className="font-medium uppercase tracking-wide">Camera làn ra (thực tế)</span>
        </div>
        
        <div className="flex gap-4">
          {/* Live Camera */}
          <div className="relative flex-1 aspect-[4/3] overflow-hidden rounded-xl bg-slate-800">
            <div className="absolute left-3 top-3 rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
              LIVE
            </div>
            <div className="flex h-full flex-col items-center justify-center text-center text-white">
              <p className="text-sm">Camera 01 - Làn ra chính</p>
            </div>
          </div>
          
          {/* Detected Plate Display */}
          <div className="flex flex-1 flex-col rounded-xl border-2 border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs text-slate-500 uppercase tracking-wide">Biển số nhận diện</p>
            
            {isManualEntryMode ? (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={manualPlateInput}
                  onChange={(e) => onManualPlateChange?.(e.target.value)}
                  placeholder="GÕ BIỂN SỐ..."
                  className="rounded-lg border-2 border-orange-300 bg-white px-3 py-2 text-xl font-bold text-slate-800 placeholder-slate-400 focus:border-orange-400 focus:outline-none"
                />
                <button
                  onClick={onManualPlateConfirm}
                  className="rounded-lg bg-orange-500 px-4 py-2 font-semibold text-white hover:bg-orange-600"
                >
                  XÁC NHẬN
                </button>
              </div>
            ) : (
              <p className={`text-4xl font-bold leading-tight ${hasError ? "text-red-500" : "text-slate-800"}`}>
                {formatPlateDisplay(currentPlate)}
              </p>
            )}
            
            <button
              onClick={onManualEntry}
              className="mt-auto flex items-center justify-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <Edit3 className="h-4 w-4" />
              <span>Nhập tay (Cam lỗi)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Historical Data Section */}
      <div className={`rounded-2xl border-2 p-4 ${hasError ? "border-red-400" : "border-slate-200"} bg-white`}>
        <div className="mb-3 flex items-center gap-2 text-sm text-slate-600">
          <Camera className="h-4 w-4" />
          <span className="font-medium uppercase tracking-wide">Dữ liệu đối chiếu (lúc vào)</span>
        </div>
        
        <div className="flex gap-4">
          {/* Historical Image */}
          <div className="relative flex-1 aspect-[4/3] overflow-hidden rounded-xl bg-slate-100">
            <div className="absolute left-3 top-3 rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
              LỊCH SỬ
            </div>
            <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
              {status === "card-error" ? (
                <p className="text-sm">Không tìm thấy</p>
              ) : (
                <p className="text-sm">Ảnh chụp lúc {entryTime}</p>
              )}
            </div>
          </div>
          
          {/* Original Plate */}
          <div className="flex flex-1 flex-col rounded-xl border-2 border-slate-200 bg-white p-4">
            <p className="mb-2 text-xs text-slate-500 uppercase tracking-wide">Biển số gốc</p>
            {status === "card-error" ? (
              <p className="text-3xl font-bold text-slate-400">---------</p>
            ) : (
              <p className="text-4xl font-bold leading-tight text-slate-800">
                {formatPlateDisplay(originalPlate)}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

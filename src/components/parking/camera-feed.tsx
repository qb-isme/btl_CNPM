type DetectionStatus = "detected" | "not-detected" | "parking-full" | "idle"

interface CameraFeedProps {
  detectedPlate?: string
  detectionStatus: DetectionStatus
  onManualEntry: () => void
  isManualEntryActive?: boolean
}

export function CameraFeed({ detectedPlate, detectionStatus, onManualEntry, isManualEntryActive = false }: CameraFeedProps) {
  const getStatusBadge = () => {
    switch (detectionStatus) {
      case "detected":
        return <div className="absolute bottom-4 left-4 rounded bg-green-500 px-3 py-1 text-sm font-medium text-white">{detectedPlate}</div>
      case "not-detected":
        return <div className="absolute bottom-4 left-4 rounded bg-orange-500 px-3 py-1 text-sm font-medium text-white">Không nhận diện được biển số</div>
      case "parking-full":
        return <div className="absolute bottom-4 left-4 rounded bg-amber-500 px-3 py-1 text-sm font-bold uppercase text-white">Bãi xe đã đầy! Tạm dừng tiếp nhận xe mới</div>
      default:
        return null
    }
  }

  const getDisplayPlate = () => {
    if (detectionStatus === "not-detected") return "51H-........"
    if (detectionStatus === "parking-full" || detectionStatus === "idle") return ""
    return detectedPlate || ""
  }

  const showLoadingDots = detectionStatus === "parking-full" || detectionStatus === "idle"

  return (
    <div className="flex flex-col gap-4">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-[#1e293b]">
        <div className="flex h-full flex-col items-center justify-center text-center text-white">
          <p className="text-xl font-bold">LUỒNG CAMERA</p>
          <p className="text-lg">(Làn Vào • Real-time Detection)</p>
        </div>
        {getStatusBadge()}
      </div>

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex-1">
          <p className="mb-1 text-xs uppercase tracking-wide text-slate-500">Biển số nhận diện</p>
          {showLoadingDots ? (
            <div className="flex items-center gap-2 py-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-2 w-2 rounded-full bg-slate-400" />
              ))}
            </div>
          ) : (
            <p className="text-4xl font-bold tracking-wider text-slate-800">{getDisplayPlate()}</p>
          )}
        </div>
        <button
          onClick={onManualEntry}
          className={`rounded-xl px-6 py-3 font-semibold transition-colors ${
            isManualEntryActive ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          Nhập tay
        </button>
      </div>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"

type SystemStatus = "online" | "offline" | "parking-full"

interface HeaderProps {
  status: SystemStatus
  gateName?: string
  operatorName?: string
  gateType?: "entry" | "exit"
}

export function Header({ 
  status, 
  gateName = "Cổng X", 
  operatorName = "Tên NV Vận hành",
  gateType = "entry"
}: HeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
  }

  const getStatusBadge = () => {
    switch (status) {
      case "online":
        return (
          <div className="rounded-full bg-green-100 px-6 py-2 text-green-600 font-semibold text-lg">
            Online
          </div>
        )
      case "offline":
        return (
          <div className="rounded-full bg-red-100 px-6 py-2 text-red-500 font-semibold text-lg">
            Offline
          </div>
        )
      case "parking-full":
        return (
          <div className="rounded-full bg-amber-100 border border-amber-300 px-4 py-2 text-amber-600 font-semibold text-lg">
            Online - Bãi Đầy
          </div>
        )
    }
  }

  const gateLabel = gateType === "entry" ? "CỔNG VÀO" : "CỔNG RA"

  return (
    <header className="flex items-start justify-between px-6 py-4">
      {/* Left: Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Hệ Thống Quản Lý Bãi Xe</h1>
        <p className="text-sm text-slate-500 uppercase tracking-wide">
          {gateLabel} • AI SMART PARKING
        </p>
      </div>

      {/* Center: Time and Status */}
      <div className="flex items-center gap-4">
        <div className="rounded-full border border-slate-200 bg-white px-6 py-2 text-xl font-mono text-slate-700">
          {formatTime(currentTime)}
        </div>
        {getStatusBadge()}
      </div>

      {/* Right: Operator Info */}
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-8 w-8"
          >
            {/* Hard hat */}
            <ellipse cx="12" cy="8" rx="7" ry="4" fill="#F59E0B" />
            <path d="M5 8c0 1.5 1 3 2 4v2h10v-2c1-1 2-2.5 2-4" stroke="#D97706" strokeWidth="1.5" fill="none" />
            <rect x="10" y="4" width="4" height="2" rx="1" fill="#FCD34D" />
            {/* Face */}
            <circle cx="12" cy="16" r="3" fill="#FBBF24" />
            {/* Body */}
            <path d="M8 22v-3a4 4 0 0 1 8 0v3" fill="#F59E0B" />
          </svg>
        </div>
        <div className="text-right">
          <p className="text-sm text-slate-600">
            {gateName} • {operatorName}
          </p>
        </div>
      </div>
    </header>
  )
}

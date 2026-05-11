"use client"

import { useState } from "react"
import Link from "next/link"
import Header from "@/components/parking/Header"
import { ExitCameraFeed } from "@/components/parking/exit-camera-feed"
import { ExitCustomerInfo } from "@/components/parking/exit-customer-info"

type SystemStatus = "online" | "offline" | "parking-full"
type ExitStatus = "valid" | "security-warning" | "card-error" | "offline"
type CustomerType = "visitor" | "internal"

export default function ParkingExitPage() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("online")
  const [exitStatus, setExitStatus] = useState<ExitStatus>("valid")
  const [currentPlate, setCurrentPlate] = useState("51H-987.65")
  const [originalPlate] = useState("51H-987.65")
  const [cardId] = useState("1234567890")
  const [customerType, setCustomerType] = useState<CustomerType>("internal")
  const [customerName] = useState("NGUYỄN VĂN A")
  const [isManualEntryMode, setIsManualEntryMode] = useState(false)
  const [manualPlateInput, setManualPlateInput] = useState("")

  const handleManualEntry = () => {
    setIsManualEntryMode(!isManualEntryMode)
  }

  const handleManualPlateConfirm = () => {
    if (manualPlateInput) {
      setCurrentPlate(manualPlateInput)
      setIsManualEntryMode(false)
    }
  }

  const handleConfirmExit = () => {
    console.log("Confirming exit for:", { currentPlate, cardId })
  }

  const handleReportLostCard = () => {
    console.log("Reporting lost card")
  }

  const handleCallSupport = () => {
    console.log("Calling support")
  }

  // Demo controls
  const cycleExitStatus = () => {
    const statuses: ExitStatus[] = ["valid", "security-warning", "card-error", "offline"]
    const currentIndex = statuses.indexOf(exitStatus)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]
    setExitStatus(nextStatus)
    
    if (nextStatus === "offline") {
      setSystemStatus("offline")
    } else {
      setSystemStatus("online")
    }
    
    if (nextStatus === "security-warning") {
      setCurrentPlate("59T1-123.45")
    } else {
      setCurrentPlate("51H-987.65")
    }
  }

  const toggleCustomerType = () => {
    setCustomerType(customerType === "visitor" ? "internal" : "visitor")
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="px-6 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Left Column: Camera Feeds - 3 columns */}
          <div className="lg:col-span-3">
            <ExitCameraFeed
              currentPlate={currentPlate}
              originalPlate={originalPlate}
              entryTime="10:24 AM"
              status={exitStatus}
              onManualEntry={handleManualEntry}
              isManualEntryMode={isManualEntryMode}
              manualPlateInput={manualPlateInput}
              onManualPlateChange={setManualPlateInput}
              onManualPlateConfirm={handleManualPlateConfirm}
            />
          </div>

          {/* Right Column: Customer Info - 2 columns */}
          <div className="lg:col-span-2">
            <ExitCustomerInfo
              status={exitStatus}
              cardId={cardId}
              customerType={customerType}
              customerName={customerName}
              onConfirmExit={handleConfirmExit}
              onReportLostCard={handleReportLostCard}
              onCallSupport={handleCallSupport}
            />
          </div>
        </div>

        {/* Demo Controls */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={cycleExitStatus}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Trạng thái: {exitStatus} · Hệ thống: {systemStatus}
          </button>
          <button
            onClick={toggleCustomerType}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Loại khách: {customerType === "visitor" ? "Vãng lai" : "Nội bộ"}
          </button>
          <Link
            href="/xe-vao"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Xem luồng Xe Vào
          </Link>
        </div>
      </main>
    </div>
  )
}

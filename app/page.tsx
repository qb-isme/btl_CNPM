"use client"

import { useState } from "react"
import Link from "next/link"
import { Header } from "@/components/parking/header"
import { CameraFeed } from "@/components/parking/camera-feed"
import { CardProcessing } from "@/components/parking/card-processing"

type SystemStatus = "online" | "offline" | "parking-full"
type DetectionStatus = "detected" | "not-detected" | "parking-full" | "idle"
type FormStatus = "normal" | "error" | "error-locked" | "parking-full" | "offline-warning"
type CustomerType = "visitor" | "internal"

export default function ParkingEntryPage() {
  // System state
  const [systemStatus, setSystemStatus] = useState<SystemStatus>("online")
  const [detectionStatus, setDetectionStatus] = useState<DetectionStatus>("detected")
  const [formStatus, setFormStatus] = useState<FormStatus>("normal")
  
  // Form state
  const [detectedPlate, setDetectedPlate] = useState("51H-987.65")
  const [cardId, setCardId] = useState("1234567890")
  const [customerType, setCustomerType] = useState<CustomerType>("internal")
  const [fullName, setFullName] = useState("Nguyễn Văn A")
  const [employeeId, setEmployeeId] = useState("241xxxx")
  const [isManualEntry, setIsManualEntry] = useState(false)

  const handleManualEntry = () => {
    setIsManualEntry(!isManualEntry)
    if (!isManualEntry) {
      setDetectionStatus("not-detected")
    } else {
      setDetectionStatus("detected")
    }
  }

  const handleCreateSession = () => {
    console.log("Creating session:", {
      plate: detectedPlate,
      cardId,
      customerType,
      fullName,
      employeeId,
    })
  }

  const handleRefresh = () => {
    setCardId("")
    setFullName("")
    setEmployeeId("")
    setFormStatus("normal")
  }

  // Demo: Toggle different states
  const cycleStatus = () => {
    const statuses: SystemStatus[] = ["online", "offline", "parking-full"]
    const currentIndex = statuses.indexOf(systemStatus)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]
    setSystemStatus(nextStatus)

    // Update related states
    if (nextStatus === "parking-full") {
      setDetectionStatus("parking-full")
      setFormStatus("parking-full")
    } else if (nextStatus === "offline") {
      setDetectionStatus("detected")
      setFormStatus("offline-warning")
    } else {
      setDetectionStatus("detected")
      setFormStatus("normal")
    }
  }

  const cycleError = () => {
    const errorStatuses: FormStatus[] = ["normal", "error", "error-locked"]
    const currentIndex = errorStatuses.indexOf(formStatus)
    const nextStatus = errorStatuses[(currentIndex + 1) % errorStatuses.length]
    setFormStatus(nextStatus)
    
    if (nextStatus === "error") {
      setCardId("ERR-998877")
    } else if (nextStatus === "error-locked") {
      setCardId("1234567890")
    } else {
      setCardId("1234567890")
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header
        status={systemStatus}
        gateName="Cổng X"
        operatorName="Tên NV Vận hành"
        gateType="entry"
      />

      <main className="px-6 pb-6">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Left Column: Camera Feed */}
          <div>
            <CameraFeed
              detectedPlate={detectedPlate}
              detectionStatus={detectionStatus}
              onManualEntry={handleManualEntry}
              isManualEntryActive={isManualEntry}
            />
          </div>

          {/* Right Column: Card Processing */}
          <div className="lg:pl-8">
            <CardProcessing
              formStatus={formStatus}
              cardId={cardId}
              customerType={customerType}
              fullName={fullName}
              employeeId={employeeId}
              onCardIdChange={setCardId}
              onCustomerTypeChange={setCustomerType}
              onFullNameChange={setFullName}
              onEmployeeIdChange={setEmployeeId}
              onCreateSession={handleCreateSession}
              onRefresh={handleRefresh}
              isOffline={systemStatus === "offline"}
            />
          </div>
        </div>

        {/* Demo Controls */}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <button
            onClick={cycleStatus}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Trạng thái hệ thống: {systemStatus}
          </button>
          <button
            onClick={cycleError}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Trạng thái lỗi: {formStatus}
          </button>
          <Link
            href="/xe-ra"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Xem luồng Xe Ra
          </Link>
        </div>
      </main>
    </div>
  )
}

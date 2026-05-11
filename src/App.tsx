import { Navigate, Route, Routes } from "react-router-dom"
import ParkingGate from "@/pages/public/ParkingGate/ParkingGate"
import ParkingGateExit from "@/pages/public/ParkingGate/ParkingGateExit"

export default function App() {
  return (
    <Routes>
      <Route path="/parking-gate" element={<ParkingGate />} />
      <Route path="/parking-gate/xe-ra" element={<ParkingGateExit />} />
      <Route path="*" element={<Navigate to="/parking-gate" replace />} />
    </Routes>
  )
}

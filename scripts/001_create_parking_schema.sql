-- Parking Lot Management System Schema

-- Zones table (Khu vực: A, B, C, D, E, F)
CREATE TABLE IF NOT EXISTS zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  total_slots INTEGER NOT NULL DEFAULT 100,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parking slots table (Vị trí đỗ xe trong mỗi khu vực)
CREATE TABLE IF NOT EXISTS parking_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  zone_id UUID NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
  slot_number INTEGER NOT NULL,
  row_number INTEGER NOT NULL DEFAULT 1,
  col_number INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'reserved', 'maintenance')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(zone_id, slot_number)
);

-- Vehicles table (Thông tin xe)
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_plate VARCHAR(20) NOT NULL UNIQUE,
  vehicle_type VARCHAR(20) NOT NULL DEFAULT 'car' CHECK (vehicle_type IN ('car', 'motorcycle', 'truck', 'bus')),
  owner_name VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Parking sessions table (Phiên đỗ xe)
CREATE TABLE IF NOT EXISTS parking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id UUID NOT NULL REFERENCES parking_slots(id) ON DELETE CASCADE,
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  check_out_time TIMESTAMP WITH TIME ZONE,
  fee DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_parking_slots_zone_id ON parking_slots(zone_id);
CREATE INDEX IF NOT EXISTS idx_parking_slots_status ON parking_slots(status);
CREATE INDEX IF NOT EXISTS idx_parking_sessions_slot_id ON parking_sessions(slot_id);
CREATE INDEX IF NOT EXISTS idx_parking_sessions_status ON parking_sessions(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);

-- Enable RLS
ALTER TABLE zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE parking_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (no auth required for this demo)
CREATE POLICY "Allow public read zones" ON zones FOR SELECT USING (true);
CREATE POLICY "Allow public read parking_slots" ON parking_slots FOR SELECT USING (true);
CREATE POLICY "Allow public read vehicles" ON vehicles FOR SELECT USING (true);
CREATE POLICY "Allow public read parking_sessions" ON parking_sessions FOR SELECT USING (true);

-- Allow public insert/update/delete for demo purposes
CREATE POLICY "Allow public insert zones" ON zones FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update zones" ON zones FOR UPDATE USING (true);
CREATE POLICY "Allow public delete zones" ON zones FOR DELETE USING (true);

CREATE POLICY "Allow public insert parking_slots" ON parking_slots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update parking_slots" ON parking_slots FOR UPDATE USING (true);
CREATE POLICY "Allow public delete parking_slots" ON parking_slots FOR DELETE USING (true);

CREATE POLICY "Allow public insert vehicles" ON vehicles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update vehicles" ON vehicles FOR UPDATE USING (true);
CREATE POLICY "Allow public delete vehicles" ON vehicles FOR DELETE USING (true);

CREATE POLICY "Allow public insert parking_sessions" ON parking_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update parking_sessions" ON parking_sessions FOR UPDATE USING (true);
CREATE POLICY "Allow public delete parking_sessions" ON parking_sessions FOR DELETE USING (true);

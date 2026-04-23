-- Seed data for Parking Lot Management System

-- Insert zones (Khu A-F)
INSERT INTO zones (name, total_slots, status) VALUES
  ('Khu A', 100, 'active'),
  ('Khu B', 100, 'active'),
  ('Khu C', 100, 'active'),
  ('Khu D', 100, 'maintenance'),
  ('Khu E', 100, 'active'),
  ('Khu F', 100, 'active')
ON CONFLICT (name) DO NOTHING;

-- Function to create parking slots for each zone
DO $$
DECLARE
  zone_record RECORD;
  slot_num INTEGER;
  row_num INTEGER;
  col_num INTEGER;
BEGIN
  FOR zone_record IN SELECT id, name, total_slots FROM zones LOOP
    FOR slot_num IN 1..zone_record.total_slots LOOP
      row_num := ((slot_num - 1) / 10) + 1;
      col_num := ((slot_num - 1) % 10) + 1;
      
      INSERT INTO parking_slots (zone_id, slot_number, row_number, col_number, status)
      VALUES (
        zone_record.id,
        slot_num,
        row_num,
        col_num,
        CASE
          WHEN zone_record.name = 'Khu D' THEN 'maintenance'
          ELSE 'available'
        END
      )
      ON CONFLICT (zone_id, slot_number) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- Insert some sample vehicles
INSERT INTO vehicles (license_plate, vehicle_type, owner_name, phone) VALUES
  ('29A-12345', 'car', 'Nguyen Van A', '0901234567'),
  ('30B-67890', 'car', 'Tran Thi B', '0912345678'),
  ('31C-11111', 'motorcycle', 'Le Van C', '0923456789'),
  ('32D-22222', 'car', 'Pham Thi D', '0934567890'),
  ('33E-33333', 'car', 'Hoang Van E', '0945678901'),
  ('34F-44444', 'motorcycle', 'Vu Thi F', '0956789012'),
  ('35G-55555', 'car', 'Bui Van G', '0967890123'),
  ('36H-66666', 'car', 'Do Thi H', '0978901234'),
  ('37I-77777', 'truck', 'Ngo Van I', '0989012345'),
  ('38J-88888', 'car', 'Ly Thi J', '0990123456')
ON CONFLICT (license_plate) DO NOTHING;

-- Occupy some slots with vehicles
DO $$
DECLARE
  zone_a_id UUID;
  zone_b_id UUID;
  zone_c_id UUID;
  zone_f_id UUID;
  vehicle_rec RECORD;
  slot_rec RECORD;
  counter INTEGER := 0;
BEGIN
  SELECT id INTO zone_a_id FROM zones WHERE name = 'Khu A';
  SELECT id INTO zone_b_id FROM zones WHERE name = 'Khu B';
  SELECT id INTO zone_c_id FROM zones WHERE name = 'Khu C';
  SELECT id INTO zone_f_id FROM zones WHERE name = 'Khu F';
  
  -- Occupy 55 slots in Khu A (45 available)
  FOR slot_rec IN 
    SELECT id FROM parking_slots 
    WHERE zone_id = zone_a_id AND status = 'available' 
    ORDER BY slot_number LIMIT 55
  LOOP
    UPDATE parking_slots SET status = 'occupied' WHERE id = slot_rec.id;
  END LOOP;
  
  -- Occupy 10 slots in Khu B (90 available)
  FOR slot_rec IN 
    SELECT id FROM parking_slots 
    WHERE zone_id = zone_b_id AND status = 'available' 
    ORDER BY slot_number LIMIT 10
  LOOP
    UPDATE parking_slots SET status = 'occupied' WHERE id = slot_rec.id;
  END LOOP;
  
  -- Occupy all 100 slots in Khu C (0 available)
  FOR slot_rec IN 
    SELECT id FROM parking_slots 
    WHERE zone_id = zone_c_id AND status = 'available' 
    ORDER BY slot_number
  LOOP
    UPDATE parking_slots SET status = 'occupied' WHERE id = slot_rec.id;
  END LOOP;
  
  -- Occupy 70 slots in Khu F (30 available)
  FOR slot_rec IN 
    SELECT id FROM parking_slots 
    WHERE zone_id = zone_f_id AND status = 'available' 
    ORDER BY slot_number LIMIT 70
  LOOP
    UPDATE parking_slots SET status = 'occupied' WHERE id = slot_rec.id;
  END LOOP;
  
  -- Create parking sessions for some occupied slots
  FOR vehicle_rec IN SELECT id FROM vehicles LIMIT 10 LOOP
    counter := counter + 1;
    FOR slot_rec IN 
      SELECT id FROM parking_slots 
      WHERE status = 'occupied' 
      ORDER BY RANDOM() LIMIT 1
    LOOP
      INSERT INTO parking_sessions (slot_id, vehicle_id, check_in_time, status)
      VALUES (slot_rec.id, vehicle_rec.id, NOW() - (counter || ' hours')::INTERVAL, 'active')
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

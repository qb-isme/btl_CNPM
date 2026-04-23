import { NextResponse } from 'next/server';
import { getSlotById, updateSlotStatus } from '@/lib/parking-data';

export async function POST(request: Request) {
  try {
    const { slotId, licensePlate, vehicleType } = await request.json();
    
    const slot = getSlotById(slotId);
    
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    
    if (slot.status !== 'available') {
      return NextResponse.json({ error: 'Slot is not available' }, { status: 400 });
    }
    
    const updatedSlot = updateSlotStatus(slotId, 'occupied', {
      licensePlate,
      vehicleType,
      checkInTime: new Date(),
    });
    
    return NextResponse.json({ success: true, slot: updatedSlot });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

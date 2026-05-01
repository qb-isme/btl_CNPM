import { NextResponse } from 'next/server';
import { getSlotById, updateSlotStatus } from '@/lib/parking-data';

export async function POST(request: Request) {
  try {
    const { slotId } = await request.json();
    
    const slot = getSlotById(slotId);
    
    if (!slot) {
      return NextResponse.json({ error: 'Slot not found' }, { status: 404 });
    }
    
    if (slot.status !== 'occupied') {
      return NextResponse.json({ error: 'Slot is not occupied' }, { status: 400 });
    }
    
    const checkInTime = slot.vehicle?.checkInTime;
    const checkOutTime = new Date();
    const duration = checkInTime 
      ? Math.max(1, Math.ceil((checkOutTime.getTime() - new Date(checkInTime).getTime()) / (1000 * 60 * 60)))
      : 1;
    const fee = duration * 10000; // 10,000 VND per hour
    
    const vehicle = slot.vehicle;
    updateSlotStatus(slotId, 'available');
    
    return NextResponse.json({
      success: true,
      slot: getSlotById(slotId),
      vehicle,
      duration,
      fee,
      checkOutTime,
    });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

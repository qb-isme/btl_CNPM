import { NextResponse } from 'next/server';
import { zones, getZoneWithOccupancy } from '@/lib/parking-data';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const zone = zones.find(z => z.id === id);
  
  if (!zone) {
    return NextResponse.json({ error: 'Zone not found' }, { status: 404 });
  }
  
  return NextResponse.json(getZoneWithOccupancy(zone));
}

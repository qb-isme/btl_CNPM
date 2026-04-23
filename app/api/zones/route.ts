import { NextResponse } from 'next/server';
import { getAllZonesWithOccupancy } from '@/lib/parking-data';

export async function GET() {
  const zones = getAllZonesWithOccupancy();
  return NextResponse.json(zones);
}

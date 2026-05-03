import { NextResponse } from 'next/server';

import { getIotHealthDashboard } from '@/lib/parking-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json(getIotHealthDashboard());
}

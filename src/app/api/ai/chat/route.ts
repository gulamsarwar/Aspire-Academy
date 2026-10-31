import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export { POST } from '@/app/api/neuron/chat/route';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    service: 'Neuron AI Academic Assistant',
    provider: 'Aspire Academy Intelligence Engine',
  });
}

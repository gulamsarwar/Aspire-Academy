import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || '';
    const hasSecret = Boolean(process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_SECRET.length > 5);
    const isLive = keyId.startsWith('rzp_live_');
    const isTest = keyId.startsWith('rzp_test_');

    return NextResponse.json({
      configured: Boolean(keyId && hasSecret),
      isLive,
      isTest,
      keyIdMasked: keyId ? `${keyId.slice(0, 8)}...${keyId.slice(-4)}` : 'Not configured',
      hasSecret,
      rawKeyId: keyId,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to read Razorpay status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyId, keySecret, webhookSecret } = body;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay Key ID and Key Secret are required.' },
        { status: 400 }
      );
    }

    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    const updateEnvVar = (content: string, key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
      } else {
        return content.trim() + `\n${key}=${value}\n`;
      }
    };

    envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_RAZORPAY_KEY_ID', keyId.trim());
    envContent = updateEnvVar(envContent, 'RAZORPAY_KEY_ID', keyId.trim());
    envContent = updateEnvVar(envContent, 'RAZORPAY_KEY_SECRET', keySecret.trim());
    if (webhookSecret && webhookSecret.trim()) {
      envContent = updateEnvVar(envContent, 'RAZORPAY_WEBHOOK_SECRET', webhookSecret.trim());
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    // Update in-memory process.env
    process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID = keyId.trim();
    process.env.RAZORPAY_KEY_ID = keyId.trim();
    process.env.RAZORPAY_KEY_SECRET = keySecret.trim();
    if (webhookSecret && webhookSecret.trim()) {
      process.env.RAZORPAY_WEBHOOK_SECRET = webhookSecret.trim();
    }

    return NextResponse.json({
      success: true,
      message: `Razorpay ${keyId.startsWith('rzp_live_') ? 'LIVE Production' : 'Test'} keys saved successfully!`,
      isLive: keyId.startsWith('rzp_live_'),
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save Razorpay keys.' },
      { status: 500 }
    );
  }
}

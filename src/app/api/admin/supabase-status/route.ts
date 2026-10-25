import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { testSupabaseConnection } from '@/lib/data/supabase-service';

export async function GET() {
  try {
    const diagnostic = await testSupabaseConnection();
    return NextResponse.json(diagnostic);
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: err?.message || 'Failed to test Supabase connection',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supabaseUrl, anonKey, serviceRoleKey } = body;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json(
        { error: 'Supabase Project URL and Anon Key are required.' },
        { status: 400 }
      );
    }

    const envPath = path.join(process.cwd(), '.env.local');
    let envContent = '';

    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Helper to replace or append env line
    const updateEnvVar = (content: string, key: string, value: string) => {
      const regex = new RegExp(`^${key}=.*$`, 'm');
      if (regex.test(content)) {
        return content.replace(regex, `${key}=${value}`);
      } else {
        return content.trim() + `\n${key}=${value}\n`;
      }
    };

    envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_SUPABASE_URL', supabaseUrl.trim());
    envContent = updateEnvVar(envContent, 'NEXT_PUBLIC_SUPABASE_ANON_KEY', anonKey.trim());
    if (serviceRoleKey && serviceRoleKey.trim()) {
      envContent = updateEnvVar(envContent, 'SUPABASE_SERVICE_ROLE_KEY', serviceRoleKey.trim());
    }

    fs.writeFileSync(envPath, envContent, 'utf8');

    // Also update current process.env in memory
    process.env.NEXT_PUBLIC_SUPABASE_URL = supabaseUrl.trim();
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = anonKey.trim();
    if (serviceRoleKey && serviceRoleKey.trim()) {
      process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRoleKey.trim();
    }

    // Retest connection with new keys
    const testResult = await testSupabaseConnection();

    return NextResponse.json({
      success: true,
      message: 'Supabase configuration saved to .env.local successfully!',
      testResult,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to save configuration.' },
      { status: 500 }
    );
  }
}

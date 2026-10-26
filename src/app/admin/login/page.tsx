'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { BrandLogo } from '@/components/layout/BrandLogo';
import {
  Shield,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
} from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { setAdminSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !password) {
      setError('Please provide your administrator email and security password.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Administrator authentication failed.');
      }

      setSuccess('Administrator access verified. Redirecting to control center...');
      setAdminSession(data.user);

      // Full window navigation ensures admin session cookie is sent and state is fully refreshed
      setTimeout(() => {
        window.location.href = '/admin';
      }, 300);
    } catch (err: any) {
      setError(err?.message || 'Access Denied: You do not have administrator privileges.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutofillAdmin = () => {
    setEmail('aspireacademyamba@gmail.com');
    setPassword('AspireAdmin@2026!');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-white">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mx-auto shadow-xl shadow-amber-500/10">
          <Shield className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Aspire Academy — Admin Portal
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Strictly restricted area. Authorized faculty and administrator credentials are required.
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-slate-800 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-4 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Administrator Email Address <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@aspireacademy.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Security Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-700 bg-slate-950 text-white placeholder:text-slate-600 text-sm focus:outline-none focus:border-amber-500 transition font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-black text-sm text-slate-950 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate as Administrator</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Fill Demo Credentials for Shekhar Sir */}
          <div className="pt-2 border-t border-slate-800 space-y-2 text-center">
            <button
              type="button"
              onClick={handleAutofillAdmin}
              className="w-full py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs font-bold text-amber-400 transition"
            >
              ⚡ Click to Auto-fill Admin Credentials
            </button>
            <p className="text-[11px] text-slate-400">
              Email: <span className="text-white font-mono">aspireacademyamba@gmail.com</span>
              <br />
              Password: <span className="text-white font-mono">AspireAdmin@2026!</span> or <span className="text-white font-mono">ShekharSir@Aspire2026</span>
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800/80 text-center">
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition font-semibold"
            >
              <span>← Go to Student Portal Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

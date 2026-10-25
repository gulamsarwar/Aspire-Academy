'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { BrandLogo } from '@/components/layout/BrandLogo';
import {
  Lock,
  Mail,
  Phone,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';

function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const { customLogin, loginWithGoogle, loginWithPhone, loginAsAdmin } = useAuth();

  // Login Mode: 'email' or 'phone'
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneAuthType, setPhoneAuthType] = useState<'otp' | 'password'>('otp');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Handle Google / Gmail OAuth Login
  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      router.push(redirectUrl);
    } catch {
      setError('Unable to complete Google sign-in. Please try email or mobile.');
      setLoading(false);
    }
  };

  // Handle Send Mobile OTP
  const handleSendOtp = () => {
    setError('');
    const cleanDigits = phone.replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSent(true);
    setInfoMessage(`OTP sent to +91 ${cleanDigits.slice(-10)}. Use code: 123456`);
  };

  // Handle Login Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (loginMethod === 'email') {
      if (!email.trim() || !password) {
        setError('Please enter your email ID and password.');
        return;
      }

      setLoading(true);
      setTimeout(() => {
        setLoading(false);
        // Check for Shekhar Sir admin account
        if (
          email.toLowerCase().includes('admin') ||
          email.toLowerCase().includes('shekhar')
        ) {
          loginAsAdmin();
          router.push('/admin');
        } else {
          const userName = email.split('@')[0].replace(/[._-]/g, ' ');
          const formattedName =
            userName.charAt(0).toUpperCase() + userName.slice(1);
          customLogin(email.trim(), formattedName, 'student');
          router.push(redirectUrl);
        }
      }, 500);
    } else {
      // Mobile Number Login
      const cleanDigits = phone.replace(/\D/g, '');
      if (cleanDigits.length < 10) {
        setError('Please enter a valid 10-digit mobile number.');
        return;
      }

      if (phoneAuthType === 'otp') {
        if (!otpSent) {
          handleSendOtp();
          return;
        }
        if (!otp.trim() || otp.trim().length < 4) {
          setError('Please enter the 6-digit OTP received on your mobile.');
          return;
        }
      } else {
        if (!password) {
          setError('Please enter your account password.');
          return;
        }
      }

      setLoading(true);
      try {
        await loginWithPhone(cleanDigits);
        router.push(redirectUrl);
      } catch {
        setError('Login failed. Please check your mobile number or try again.');
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo variant="dark" size="lg" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Student & Faculty Portal
        </h2>
        <p className="text-xs text-slate-500">
          Sign in to access your enrolled courses, video lessons, and live classes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-200 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* 1. Google (Gmail) One-Click Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 font-bold text-sm text-slate-700 transition shadow-sm flex items-center justify-center gap-3 group"
          >
            <GoogleIcon />
            <span>Continue with Google / Gmail</span>
          </button>

          {/* Clean Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Or sign in with
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Method Tabs: Email vs Mobile */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email');
                setError('');
                setInfoMessage('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                loginMethod === 'email'
                  ? 'bg-white text-[#046BD2] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email / Gmail ID</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('phone');
                setError('');
                setInfoMessage('');
              }}
              className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                loginMethod === 'phone'
                  ? 'bg-white text-[#046BD2] shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Mobile Number</span>
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMethod === 'email' ? (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Email Address / Gmail
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="student@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">Password</label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-[11px] font-bold text-[#046BD2] hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Mobile Number
                  </label>
                  <div className="flex rounded-xl border border-slate-200 overflow-hidden focus-within:border-[#046BD2]">
                    <span className="bg-slate-100 px-3.5 py-2.5 text-xs font-bold text-slate-600 flex items-center border-r border-slate-200">
                      🇮🇳 +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      placeholder="98765 43210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Sub-toggle: OTP or Password */}
                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-500">Sign in using:</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPhoneAuthType('otp')}
                      className={`font-bold ${
                        phoneAuthType === 'otp'
                          ? 'text-[#046BD2] underline'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      OTP Code
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setPhoneAuthType('password')}
                      className={`font-bold ${
                        phoneAuthType === 'password'
                          ? 'text-[#046BD2] underline'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      Password
                    </button>
                  </div>
                </div>

                {phoneAuthType === 'otp' ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700">
                        Verification Code (OTP)
                      </label>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[11px] font-bold text-[#046BD2] hover:underline"
                      >
                        {otpSent ? 'Resend OTP' : 'Send OTP'}
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        placeholder={otpSent ? 'Enter 6-digit OTP' : 'Click Send OTP above'}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm tracking-widest font-mono focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-md transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>
                    {loginMethod === 'phone' && phoneAuthType === 'otp' && !otpSent
                      ? 'Get OTP & Sign In'
                      : 'Sign In to Dashboard'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="text-center pt-2 text-xs text-slate-600">
            <span>Don't have an account yet? </span>
            <Link
              href="/auth/register"
              className="font-bold text-[#046BD2] hover:underline"
            >
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#046BD2] border-t-transparent rounded-full" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}


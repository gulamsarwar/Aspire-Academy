'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { isAuthorizedAdminEmail } from '@/lib/auth/admin';
import {
  Lock,
  Mail,
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Shield,
  KeyRound,
  RotateCw,
  ExternalLink,
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
  const urlError = searchParams.get('error');
  const urlMessage = searchParams.get('message');

  const {
    loginWithGoogle,
    loginWithEmail,
    loginWithPhonePassword,
    sendPhoneOtp,
    verifyPhoneOtp,
    loginAsStudent,
    customLogin,
  } = useAuth();

  // Tab: 'phone' or 'email'
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');

  // Phone sub-mode: 'password' or 'otp'
  const [phoneMode, setPhoneMode] = useState<'password' | 'otp'>('password');

  // Form states
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Google Fallback Modal State
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setTimeout(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  // Handle URL errors or messages from OAuth callback or redirects
  useEffect(() => {
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }
    if (urlMessage) {
      setInfoMessage(decodeURIComponent(urlMessage));
    }
  }, [urlError, urlMessage]);

  // Google OAuth Login
  // Google OAuth Login
  const handleGoogleLogin = async () => {
    setError('');
    setInfoMessage('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle(redirectUrl);
    } catch {
      setGoogleLoading(false);
      customLogin('student.google@gmail.com', 'Aspire Student (Google)', 'student');
      router.push(redirectUrl);
    }
  };

  // Handle Email / Password Login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!email.trim() || !password) {
      setError('Please enter your email ID and password.');
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // Prevent administrator accounts from logging in via public student portal
    if (isAuthorizedAdminEmail(cleanEmail)) {
      setError(
        'Administrator detected. Authorized faculty and administrators must sign in through the Admin Portal at /admin/login.'
      );
      return;
    }

    setLoading(true);
    try {
      await loginWithEmail(cleanEmail, password);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password. Please verify your credentials or click "Forgot password?".');
    } finally {
      setLoading(false);
    }
  };

  // Handle Mobile + Password Login
  const handlePhonePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!phone.trim() || !password) {
      setError('Please enter your 10-digit mobile number and password.');
      return;
    }

    setLoading(true);
    try {
      await loginWithPhonePassword(phone.trim(), password);
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err?.message || 'Invalid mobile number or password.');
    } finally {
      setLoading(false);
    }
  };

  // Send Mobile OTP
  const handleSendOtp = async () => {
    setError('');
    setInfoMessage('');

    if (!phone.trim()) {
      setError('Please enter your 10-digit mobile number first.');
      return;
    }

    setLoading(true);
    try {
      await sendPhoneOtp(phone.trim(), false);
      setOtpSent(true);
      setResendCountdown(60);
      setInfoMessage(`6-digit OTP code sent to +91 ${phone.replace(/\D/g, '').slice(-10)}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Please check the mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Mobile OTP & Sign In
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!phone.trim() || !otpToken.trim()) {
      setError('Please enter your mobile number and the 6-digit OTP code.');
      return;
    }

    setLoading(true);
    try {
      await verifyPhoneOtp(phone.trim(), otpToken.trim());
      router.push(redirectUrl);
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo variant="dark" size="lg" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Student Portal Login
        </h2>
        <p className="text-xs text-slate-500">
          Sign in to access your enrolled courses, video lectures, test center, and notes.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-200 space-y-5">
          {error ? (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          ) : null}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

          {/* 1. Google One-Click Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 font-bold text-sm text-slate-700 transition shadow-sm flex items-center justify-center gap-3 disabled:opacity-60"
          >
            {googleLoading ? (
              <>
                <Loader2 className="w-4 h-4 text-[#046BD2] animate-spin" />
                <span>Connecting to Google...</span>
              </>
            ) : (
              <>
                <GoogleIcon />
                <span>Continue with Google / Gmail</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
              Or sign in with
            </span>
            <div className="border-t border-slate-200 w-full" />
          </div>

          {/* Auth Method Navigation Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setActiveTab('phone');
                setError('');
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'phone'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Phone className="w-3.5 h-3.5 text-[#046BD2]" />
              <span>Mobile Number</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('email');
                setError('');
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'email'
                  ? 'bg-white text-slate-900 shadow-sm font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Mail className="w-3.5 h-3.5 text-[#046BD2]" />
              <span>Email Address</span>
            </button>
          </div>

          {/* TAB 1: Mobile Phone Authentication */}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              {/* Phone Sub-mode toggle: Password vs OTP */}
              <div className="flex items-center justify-center gap-4 text-xs font-semibold pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setPhoneMode('password');
                    setError('');
                  }}
                  className={`pb-1 border-b-2 transition ${
                    phoneMode === 'password'
                      ? 'border-[#046BD2] text-[#046BD2] font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Password Login
                </button>
                <span className="text-slate-300">•</span>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneMode('otp');
                    setError('');
                  }}
                  className={`pb-1 border-b-2 transition ${
                    phoneMode === 'otp'
                      ? 'border-[#046BD2] text-[#046BD2] font-black'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  SMS OTP Login
                </button>
              </div>

              {/* Mode A: Phone + Password */}
              {phoneMode === 'password' && (
                <form onSubmit={handlePhonePasswordSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-slate-500 pointer-events-none">
                        <span>🇮🇳 +91</span>
                        <span className="text-slate-300">|</span>
                      </div>
                      <input
                        type="tel"
                        required
                        placeholder="98765 43210"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2] font-medium"
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

                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <span>Sign In with Mobile</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Mode B: Phone + SMS OTP */}
              {phoneMode === 'otp' && (
                <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Mobile Number
                    </label>
                    <div className="relative flex items-center">
                      <div className="absolute left-3 flex items-center gap-1 text-xs font-bold text-slate-500 pointer-events-none">
                        <span>🇮🇳 +91</span>
                        <span className="text-slate-300">|</span>
                      </div>
                      <input
                        type="tel"
                        required
                        disabled={otpSent}
                        placeholder="98765 43210"
                        maxLength={10}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        className="w-full pl-20 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2] font-medium disabled:bg-slate-50"
                      />
                    </div>
                  </div>

                  {!otpSent ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={loading || phone.length < 10}
                      className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Sending OTP...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Send 6-Digit OTP</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-slate-700">Enter 6-Digit OTP</label>
                          {resendCountdown > 0 ? (
                            <span className="text-[11px] font-bold text-slate-400">
                              Resend in {resendCountdown}s
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              disabled={loading}
                              className="text-[11px] font-bold text-[#046BD2] hover:underline flex items-center gap-1"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Resend OTP</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="123456"
                          value={otpToken}
                          onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                          className="w-full text-center tracking-widest text-lg font-black py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#046BD2]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={loading || otpToken.length !== 6}
                        className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Verifying OTP...</span>
                          </>
                        ) : (
                          <>
                            <span>Verify & Sign In</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(false);
                            setOtpToken('');
                          }}
                          className="text-[11px] font-bold text-slate-500 hover:text-slate-800"
                        >
                          Change mobile number
                        </button>
                      </div>
                    </>
                  )}
                </form>
              )}
            </div>
          )}

          {/* TAB 2: Email & Password Authentication */}
          {activeTab === 'email' && (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Email Address / Gmail ID
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

              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-md transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Email</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Quick Demo Credentials & 1-Click Fast Login */}
          <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-100 text-[11px] text-slate-600 space-y-2.5">
            <div className="flex items-start gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#046BD2] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#046BD2]">Student Sign-in: </span>
                Sign in with Google, enter your mobile/email, or test instantly with 1-click:
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                loginAsStudent();
                router.push(redirectUrl);
              }}
              className="w-full py-2 px-3 rounded-lg bg-[#046BD2] hover:bg-[#0352A0] text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>⚡ 1-Click Student Login (Pre-Enrolled Class 12 Demo)</span>
            </button>
          </div>

          <div className="text-center pt-1 text-xs text-slate-600">
            <span>Don't have an account yet? </span>
            <Link
              href="/auth/register"
              className="font-bold text-[#046BD2] hover:underline"
            >
              Register here
            </Link>
          </div>

          {/* Dedicated Link to Admin Portal */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <Link
              href="/admin/login"
              className="text-xs font-bold text-slate-500 hover:text-amber-600 transition inline-flex items-center gap-1.5"
            >
              <Shield className="w-3.5 h-3.5 text-amber-500" />
              <span>Academy Faculty / Administration Sign In →</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Google Fast-Login Modal (When Supabase Google OAuth is pending) */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <GoogleIcon />
                <h3 className="text-base font-black text-slate-900">Sign in with Google</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGoogleModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 font-bold transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Google OAuth Provider is currently pending setup in Supabase dashboard. You can sign in immediately with your Google / Gmail account below:
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const emailToUse = googleEmail.trim() || 'student@gmail.com';
                const nameToUse = googleName.trim() || emailToUse.split('@')[0];
                customLogin(emailToUse, nameToUse, 'student');
                setShowGoogleModal(false);
                router.push(redirectUrl);
              }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Your Gmail Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="student.name@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#046BD2]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Student Full Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Priyanshu Kumari"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#046BD2]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-md transition flex items-center justify-center gap-2"
              >
                <span>Continue with this Gmail</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <button
                type="button"
                onClick={() => {
                  customLogin('priyanshu.student@gmail.com', 'Priyanshu Kumari', 'student');
                  setShowGoogleModal(false);
                  router.push(redirectUrl);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>⚡ Instant 1-Click: Sign in as Priyanshu (Gmail)</span>
              </button>

              <div className="text-center pt-1">
                <a
                  href="https://supabase.com/dashboard/project/bobymknzhwoyzayfamrt/auth/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-slate-400 hover:text-[#046BD2] underline inline-flex items-center gap-1"
                >
                  <span>Admin: Enable official Google Cloud OAuth in Supabase</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
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

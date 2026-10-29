'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { BrandLogo } from '@/components/layout/BrandLogo';
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Loader2,
  KeyRound,
  RotateCw,
  ExternalLink,
  Sparkles,
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

export default function RegisterPage() {
  const router = useRouter();
  const {
    registerWithEmail,
    registerWithPhonePassword,
    verifyPhoneOtp,
    sendPhoneOtp,
    loginWithGoogle,
  } = useAuth();

  // Active tab: 'phone' or 'email'
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('phone');

  // Form states
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);

  // OTP verification state for phone signup
  const [needsPhoneVerification, setNeedsPhoneVerification] = useState(false);
  const [otpToken, setOtpToken] = useState('');
  const [resendCountdown, setResendCountdown] = useState(0);

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

  const handleGoogleSignup = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle('/dashboard');
    } catch (err: any) {
      setGoogleLoading(false);
      setError(err?.message || 'Google OAuth failed.');
    }
  };

  const navigateToDashboard = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    } else {
      router.push('/dashboard');
    }
  };

  // Submit Mobile Number Signup
  const handlePhoneRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!fullName.trim() || !phone.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      await registerWithPhonePassword(phone.trim(), password, fullName.trim());
      navigateToDashboard();
    } catch (err: any) {
      setError(err?.message || 'Failed to create student account with this mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // Verify Phone OTP after signup
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!otpToken.trim() || otpToken.length !== 6) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setLoading(true);
    try {
      await verifyPhoneOtp(phone.trim(), otpToken.trim());
      navigateToDashboard();
    } catch (err: any) {
      setError(err?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend Phone Signup OTP
  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      await sendPhoneOtp(phone.trim(), true);
      setResendCountdown(60);
      setInfoMessage('New verification code sent to your mobile number.');
    } catch (err: any) {
      setError(err?.message || 'Could not resend OTP. Please wait a moment.');
    } finally {
      setLoading(false);
    }
  };

  // Submit Email Signup
  const handleEmailRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('Please accept the Terms and Privacy Policy to continue.');
      return;
    }

    setLoading(true);
    try {
      await registerWithEmail(email.trim(), password, fullName.trim());
      navigateToDashboard();
    } catch (err: any) {
      setError(err?.message || 'Failed to create account with this email address.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo variant="dark" size="lg" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Create Student Account
        </h2>
        <p className="text-xs text-slate-500">
          Join 10,000+ Bihar Board and CBSE students learning under Shekhar Sir.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-200 space-y-5">
          {error && (error.includes('GOOGLE_NOT_ENABLED') || error.includes('not enabled') || error.includes('Unsupported provider')) ? (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2.5 animate-in fade-in">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="font-bold text-amber-800">Google Login Setup Required in Supabase</span>
              </div>
              <p className="text-slate-600 text-[11.5px] leading-relaxed">
                Supabase प्रोजेक्ट (<code>bobymknzhwoyzayfamrt</code>) में Google Provider अभी चालू (Enable) नहीं है। आप नीचे <strong>Mobile Number</strong> या <strong>Email</strong> से तुरंत 2 मिनट में नया अकाउंट बना सकते हैं।
              </p>
              <div className="pt-1 flex flex-wrap gap-2">
                <a
                  href="https://supabase.com/dashboard/project/bobymknzhwoyzayfamrt/auth/providers"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition shadow-xs"
                >
                  <span>Open Supabase Providers</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setActiveTab('email');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 font-bold text-[11px] transition"
                >
                  Register with Email instead
                </button>
              </div>
            </div>
          ) : error ? (
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

          {/* If currently verifying Phone OTP */}
          {needsPhoneVerification ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#046BD2] flex items-center justify-center mx-auto mb-2">
                  <KeyRound className="w-6 h-6" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Verify Mobile Number
                </h3>
                <p className="text-xs text-slate-500">
                  Enter the 6-digit OTP sent to <strong>+91 {phone.replace(/\D/g, '').slice(-10)}</strong>
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">6-Digit Code</label>
                  {resendCountdown > 0 ? (
                    <span className="text-[11px] font-bold text-slate-400">
                      Resend in {resendCountdown}s
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResendOtp}
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
                  autoFocus
                  placeholder="123456"
                  value={otpToken}
                  onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                  className="w-full text-center tracking-widest text-xl font-black py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:border-[#046BD2]"
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
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setNeedsPhoneVerification(false)}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800"
                >
                  ← Edit registration details
                </button>
              </div>
            </form>
          ) : (
            <>
              {/* Google One-Click Signup */}
              <button
                type="button"
                onClick={handleGoogleSignup}
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
                    <span>Sign up with Google / Gmail</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex items-center justify-center">
                <div className="border-t border-slate-200 w-full" />
                <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                  Or register with
                </span>
                <div className="border-t border-slate-200 w-full" />
              </div>

              {/* Navigation Tabs */}
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

              {/* TAB 1: Mobile Number Registration */}
              {activeTab === 'phone' && (
                <form onSubmit={handlePhoneRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Mobile Number</label>
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

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Create Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="agreeTermsPhone"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#046BD2] focus:ring-[#046BD2]"
                    />
                    <label htmlFor="agreeTermsPhone" className="text-xs text-slate-500 leading-tight">
                      I agree to the{' '}
                      <Link href="/terms" className="text-[#046BD2] underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy-policy" className="text-[#046BD2] underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Register with Mobile</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* TAB 2: Email Registration */}
              {activeTab === 'email' && (
                <form onSubmit={handleEmailRegisterSubmit} className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Full Name</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder="e.g. Rahul Sharma"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Email Address</label>
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

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Create Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Confirm Password</label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>

                  <div className="flex items-start gap-2 pt-1">
                    <input
                      type="checkbox"
                      id="agreeTermsEmail"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#046BD2] focus:ring-[#046BD2]"
                    />
                    <label htmlFor="agreeTermsEmail" className="text-xs text-slate-500 leading-tight">
                      I agree to the{' '}
                      <Link href="/terms" className="text-[#046BD2] underline">
                        Terms of Service
                      </Link>{' '}
                      and{' '}
                      <Link href="/privacy-policy" className="text-[#046BD2] underline">
                        Privacy Policy
                      </Link>
                      .
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || googleLoading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Creating account...</span>
                      </>
                    ) : (
                      <>
                        <span>Register with Email</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="text-center pt-2 text-xs text-slate-600">
            <span>Already have an account? </span>
            <Link href="/auth/login" className="font-bold text-[#046BD2] hover:underline">
              Sign in here
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

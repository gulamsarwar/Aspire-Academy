'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BrandLogo } from '@/components/layout/BrandLogo';
import { useAuth } from '@/components/auth/AuthContext';
import {
  Mail,
  Phone,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
  RotateCw,
} from 'lucide-react';

export default function ForgotPasswordPage() {
  const { resetPassword, sendPhoneOtp, resetPasswordWithPhoneOtp } = useAuth();

  // Active tab: 'email' or 'phone'
  const [activeTab, setActiveTab] = useState<'phone' | 'email'>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  // Phone OTP form state
  const [phone, setPhone] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [phoneResetSuccess, setPhoneResetSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  const [loading, setLoading] = useState(false);
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

  // Handle Email Reset Submit
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email.trim());
      setEmailSent(true);
    } catch (err: any) {
      setError(
        err?.message ||
          'Failed to send password reset email. Please ensure your email is registered or contact academy support.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Handle Send Phone Reset OTP
  const handleSendPhoneResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!phone.trim() || phone.replace(/\D/g, '').length !== 10) {
      setError('Please enter your 10-digit registered mobile number.');
      return;
    }

    setLoading(true);
    try {
      await sendPhoneOtp(phone.trim(), false);
      setOtpSent(true);
      setResendCountdown(60);
      setInfoMessage(`Reset OTP sent to +91 ${phone.replace(/\D/g, '').slice(-10)}.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP to this mobile number.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Phone OTP + New Password Submit
  const handlePhoneResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (!otpToken.trim() || otpToken.length !== 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordWithPhoneOtp(phone.trim(), otpToken.trim(), newPassword);
      setPhoneResetSuccess(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to reset password. Please verify the OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3">
        <BrandLogo variant="dark" size="lg" />
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">
          Reset Your Password
        </h2>
        <p className="text-xs text-slate-500">
          Recover access using your registered mobile number or email ID.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-slate-200 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{infoMessage}</span>
            </div>
          )}

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
              <span>Via Mobile (OTP)</span>
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
              <span>Via Email</span>
            </button>
          </div>

          {/* TAB 1: Reset via Mobile OTP */}
          {activeTab === 'phone' && (
            <>
              <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 text-[11.5px] text-amber-800 space-y-1">
                <p className="font-semibold">Notice for Mobile Password Recovery:</p>
                <p className="text-amber-700 leading-relaxed">
                  If SMS delivery is unavailable in your area, please use the <strong>Via Email</strong> tab or contact Shekhar Sir on WhatsApp at <a href="https://wa.me/919123456789?text=Hello%20Shekhar%20Sir,%20I%20need%20help%20with%20my%20Aspire%20Academy%20account" target="_blank" rel="noreferrer" className="font-bold underline text-emerald-700 hover:text-emerald-800">+91 9123456789</a> for instant reset assistance.
                </p>
              </div>

              {phoneResetSuccess ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-emerald-900">
                    Password Reset Successfully!
                  </h3>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    Your password has been updated. You can now sign in with your new credentials.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-block py-2.5 px-6 rounded-xl bg-[#046BD2] text-white font-bold text-xs shadow-md transition hover:bg-[#0352A0]"
                  >
                    Sign In to Dashboard →
                  </Link>
                </div>
              ) : !otpSent ? (
                <form onSubmit={handleSendPhoneResetOtp} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Registered Mobile Number
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

                  <button
                    type="submit"
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
                        <span>Send Password Reset OTP</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handlePhoneResetSubmit} className="space-y-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400">Mobile: </span>
                      <strong className="text-slate-800">+91 {phone.replace(/\D/g, '').slice(-10)}</strong>
                    </div>
                    {resendCountdown > 0 ? (
                      <span className="text-[11px] font-bold text-slate-400">
                        Resend in {resendCountdown}s
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendPhoneResetOtp}
                        disabled={loading}
                        className="text-[11px] font-bold text-[#046BD2] hover:underline flex items-center gap-1"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>Resend OTP</span>
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      6-Digit Reset Code
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      autoFocus
                      placeholder="123456"
                      value={otpToken}
                      onChange={(e) => setOtpToken(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center tracking-widest text-lg font-black py-2 rounded-xl border border-slate-200 focus:outline-none focus:border-[#046BD2]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="At least 6 characters"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        placeholder="Re-enter new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:border-[#046BD2]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpToken.length !== 6 || newPassword.length < 6}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <>
                        <span>Reset Password & Sign In</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          {/* TAB 2: Reset via Email */}
          {activeTab === 'email' && (
            <>
              {emailSent ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-emerald-900">
                    Password Reset Link Sent
                  </h3>
                  <p className="text-xs text-emerald-700 leading-relaxed">
                    We have sent password reset instructions to <strong>{email}</strong>. Check your inbox or spam folder.
                  </p>
                  <Link
                    href="/auth/login"
                    className="inline-block text-xs font-bold text-[#046BD2] hover:underline pt-2"
                  >
                    Return to Login
                  </Link>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Registered Email Address
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

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Sending Instructions...</span>
                      </>
                    ) : (
                      <>
                        <span>Send Reset Link</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="text-center pt-2">
            <Link
              href="/auth/login"
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

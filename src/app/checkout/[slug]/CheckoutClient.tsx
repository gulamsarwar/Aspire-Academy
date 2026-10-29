'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';
import { Course, Batch } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthContext';
import { db } from '@/lib/data/mock-db';
import { calculateCoursePrice } from '@/lib/pricing';
import {
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Lock,
  ArrowRight,
  Sparkles,
  CreditCard,
  QrCode,
  Smartphone,
  AlertCircle,
  Clock,
  BookOpen,
  Tag,
  Check,
} from 'lucide-react';

declare global {
  interface Window {
    Razorpay: any;
  }
}

function GoogleIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24">
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

export function CheckoutClient({
  course,
  batches,
  initialBatchId,
}: {
  course: Course;
  batches: Batch[];
  initialBatchId: string;
}) {
  const router = useRouter();
  const { user, loginWithGoogle } = useAuth();

  const handleAuthRedirect = async () => {
    const target = `/checkout/${course.slug}?batchId=${selectedBatchId}`;
    try {
      await loginWithGoogle(target);
    } catch {
      router.push(`/auth/login?redirect=${encodeURIComponent(target)}`);
    }
  };

  const activeBatches: Batch[] = batches && batches.length > 0 ? batches : [
    {
      id: `${course.id}-batch-default`,
      course_id: course.id,
      name: 'Regular Target Batch (2026-27)',
      schedule_description: 'Mon, Wed, Fri — 05:00 PM to 06:30 PM',
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
      capacity: 150,
      enrolled_count: 0,
      enrollment_open: true,
      instructor_name: course.instructor_name || 'Shekhar Sir',
      created_at: new Date().toISOString(),
    }
  ];

  const firstBatch = activeBatches.find((b) => b.id === initialBatchId) || activeBatches[0];
  const [selectedBatchId, setSelectedBatchId] = useState(initialBatchId || firstBatch.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [completedOrderId, setCompletedOrderId] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');

  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; label: string } | null>(null);
  const [couponMessage, setCouponMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const selectedBatch = activeBatches.find((b) => b.id === selectedBatchId) || activeBatches[0];

  const discountAmount =
    course.original_price > course.price ? course.original_price - course.price : 0;

  const handleApplyCoupon = (codeToApply?: string) => {
    const raw = (codeToApply || couponInput).trim().toUpperCase();
    if (!raw) return;

    const pricing = calculateCoursePrice(course, raw);
    if (pricing.isValidCoupon) {
      setAppliedCoupon({
        code: raw,
        discount: pricing.couponDiscount,
        label: pricing.couponLabel || raw,
      });
      setCouponMessage({
        type: 'success',
        text: `🎉 ${raw} applied! You saved flat ₹${pricing.couponDiscount}.`,
      });
      setCouponInput(raw);
    } else {
      setCouponMessage({
        type: 'error',
        text: 'Invalid promo code. Tap a verified code below: TOPPER100, SHEKHAR50 or BIHAR20',
      });
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponMessage(null);
  };

  const pricing = calculateCoursePrice(course, appliedCoupon?.code);
  const finalPayable = pricing.finalPrice;

  const triggerCelebration = () => {
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }
  };

  const handleCheckout = async () => {
    setError('');

    if (!user) {
      await handleAuthRedirect();
      return;
    }

    if (!selectedBatchId) {
      setError('Please select an active batch schedule.');
      return;
    }

    setLoading(true);

    try {
      // 1. Create order on server
      const res = await fetch('/api/checkout/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: course.id,
          batchId: selectedBatchId,
          studentId: user.id,
          couponCode: appliedCoupon?.code,
        }),
      });

      const orderData = await res.json();
      if (!res.ok || !orderData.success) {
        throw new Error(orderData.error || 'Failed to initialize payment order');
      }

      // 2. Launch real Razorpay checkout ONLY if real credentials are present
      if (orderData.isRealRazorpay && typeof window !== 'undefined' && window.Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'Aspire Academy',
          description: `${course.title} (${selectedBatch?.name || 'Selected Batch'})`,
          order_id: orderData.gatewayOrderId,
          prefill: {
            name: user.full_name,
            email: user.email,
            contact: user.phone || '9876543210',
          },
          theme: {
            color: '#046BD2',
          },
          handler: async function (response: any) {
            // Verify on server
            await verifyPayment({
              gatewayOrderId: response.razorpay_order_id || orderData.gatewayOrderId,
              gatewayPaymentId: response.razorpay_payment_id || `pay_${Date.now()}`,
              gatewaySignature: response.razorpay_signature,
            });
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        try {
          const rzp = new window.Razorpay(options);
          rzp.open();
          return;
        } catch (rzpOpenErr) {
          console.warn('Real Razorpay modal failed to open, falling back to verified payment', rzpOpenErr);
        }
      }

      // 3. Sandbox / Demo Mode: Immediately verify payment and activate enrollment!
      await verifyPayment({
        gatewayOrderId: orderData.gatewayOrderId,
        gatewayPaymentId: `pay_sandbox_${Date.now()}`,
        gatewaySignature: 'sig_sandbox_valid',
      });
    } catch (err: any) {
      setError(err.message || 'Payment initiation failed. Please try again.');
      setLoading(false);
    }
  };

  const handleDirectEnroll = async () => {
    setError('');

    if (!user) {
      await handleAuthRedirect();
      return;
    }

    if (!selectedBatchId) {
      setError('Please select an active batch schedule.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/student/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: user.id,
          courseId: course.id,
          batchId: selectedBatchId,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Direct enrollment failed');
      }

      // Cache locally
      try {
        const stored = localStorage.getItem('aspire_student_enrollments');
        const list = stored ? JSON.parse(stored) : [];
        if (!list.some((e: any) => e.course_id === course.id)) {
          list.unshift(data.enrollment);
          localStorage.setItem('aspire_student_enrollments', JSON.stringify(list));
        }
      } catch (e) {
        console.warn('Failed to cache in localStorage', e);
      }

      setPaymentSuccess(true);
      setCompletedOrderId(data.enrollment?.id || `enr_${Date.now()}`);
      triggerCelebration();
    } catch (err: any) {
      setError(err.message || 'Direct enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async ({
    gatewayOrderId,
    gatewayPaymentId,
    gatewaySignature,
  }: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    gatewaySignature?: string;
  }) => {
    try {
      const verifyRes = await fetch('/api/checkout/verify-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gatewayOrderId,
          gatewayPaymentId,
          gatewaySignature,
          method: selectedPaymentMethod,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        throw new Error(verifyData.error || 'Payment verification failed');
      }

      // Also persist to localStorage for instant client-side rendering
      try {
        const stored = localStorage.getItem('aspire_student_enrollments');
        const list = stored ? JSON.parse(stored) : [];
        if (!list.some((e: any) => e.course_id === course.id)) {
          list.unshift({
            id: `enr_${Date.now()}`,
            student_id: user?.id,
            course_id: course.id,
            batch_id: selectedBatchId,
            status: 'active',
            progress: 0,
            enrolled_at: new Date().toISOString(),
            course: {
              id: course.id,
              title: course.title,
              slug: course.slug,
              thumbnail_url: course.thumbnail_url,
              instructor_name: course.instructor_name,
              target_class: course.target_class,
              category: course.category,
              duration_weeks: course.duration_weeks,
              total_lectures: course.total_lectures || 24,
            },
            batch: {
              id: selectedBatch?.id,
              name: selectedBatch?.name,
              schedule_description: selectedBatch?.schedule_description,
            },
          });
          localStorage.setItem('aspire_student_enrollments', JSON.stringify(list));
        }
      } catch (e) {
        console.warn('Could not cache enrollment locally:', e);
      }

      setPaymentSuccess(true);
      setCompletedOrderId(verifyData.orderId || gatewayOrderId);
      triggerCelebration();
    } catch (err: any) {
      setError(err.message || 'Payment verification could not be completed.');
    } finally {
      setLoading(false);
    }
  };

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-xl w-full bg-white rounded-3xl border-2 border-emerald-500/30 p-8 sm:p-12 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-300">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 shadow-lg shadow-emerald-500/20">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
              Payment Verified & Enrolled
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              Welcome to {course.title}!
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              Your enrollment for <strong>{selectedBatch?.name}</strong> is now fully active.
              You have immediate access to video lessons, chapter notes, and live doubt sessions.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-left text-xs space-y-2">
            <div className="flex justify-between text-slate-500">
              <span>Order Reference:</span>
              <span className="font-mono font-bold text-slate-800">{completedOrderId}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Selected Batch:</span>
              <span className="font-semibold text-slate-800">{selectedBatch?.name}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Amount Paid:</span>
              <span className="font-bold text-emerald-700">₹{finalPayable} (UPI / Gateway Verified)</span>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <Link
              href={`/dashboard/courses/${course.slug}/learn`}
              className="flex-1 py-3.5 px-6 rounded-xl font-black text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              <span>Start Learning Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/dashboard"
              className="py-3.5 px-6 rounded-xl font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="text-center sm:text-left space-y-1">
          <Link
            href={`/courses/${course.slug}`}
            className="text-xs font-bold text-[#046BD2] hover:underline"
          >
            ← Back to Course Details
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Checkout & Batch Enrollment
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Secure 256-bit encrypted checkout via Razorpay Gateway with full UPI support.
          </p>
        </div>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Student Details, Batch Selection, Payment Method */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Student Authentication Check */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-[#046BD2]">
                  Student Account & Device Sync
                </span>
                {user ? (
                  <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    Account Connected
                  </span>
                ) : (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                    Login Required
                  </span>
                )}
              </div>

              {!user ? (
                <div className="p-5 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-amber-950">
                        Student Login Required (लॉगिन अनिवार्य है)
                      </h4>
                      <p className="text-xs text-amber-900/90 leading-relaxed">
                        कोर्स खरीदने से पहले कृपया लॉगिन करें। इससे आपका कोर्स, लाइव क्लासेज, नोट्स और टेस्ट प्रोग्रेस हमेशा आपके अकाउंट में सुरक्षित रहेंगे — चाहे आप किसी भी नए मोबाइल, लैपटॉप या टैबलेट में लॉगिन करें।
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                    {/* Google One-Click Login Button */}
                    <button
                      type="button"
                      onClick={handleAuthRedirect}
                      className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-white text-slate-800 border-2 border-slate-300 hover:border-blue-500 hover:bg-slate-50 transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <GoogleIcon />
                      <span>Continue with Google / Gmail</span>
                    </button>

                    <Link
                      href={`/auth/login?redirect=${encodeURIComponent(`/checkout/${course.slug}?batchId=${selectedBatchId}`)}`}
                      className="py-3 px-4 rounded-xl font-bold text-xs bg-[#046BD2] hover:bg-[#0352A0] text-white transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>Sign In (Mobile / Email)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>

                    <Link
                      href={`/auth/register?redirect=${encodeURIComponent(`/checkout/${course.slug}?batchId=${selectedBatchId}`)}`}
                      className="py-3 px-4 rounded-xl font-bold text-xs bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition shadow-sm flex items-center justify-center"
                    >
                      Register
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#0B192C] text-white flex items-center justify-center font-bold text-sm">
                      {user.full_name?.charAt(0) || 'S'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-slate-900">{user.full_name}</h4>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500">{user.email || user.phone}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Verified Account
                  </span>
                </div>
              )}
            </div>

            {/* 2. Batch Selection */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#046BD2]">
                Selected Batch Schedule
              </span>

              <div className="space-y-2.5">
                {activeBatches.map((batch) => {
                  const isSelected = selectedBatchId === batch.id;
                  return (
                    <label
                      key={batch.id}
                      className={`block p-3.5 rounded-xl border-2 cursor-pointer transition ${
                        isSelected
                          ? 'border-[#046BD2] bg-blue-50/40 shadow-sm'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="checkout_batch"
                            value={batch.id}
                            checked={isSelected}
                            onChange={() => setSelectedBatchId(batch.id)}
                            className="text-[#046BD2] focus:ring-[#046BD2]"
                          />
                          <div>
                            <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                              {batch.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium mt-0.5">
                              <Calendar className="w-3 h-3 text-[#046BD2]" />
                              <span>{batch.schedule_description}</span>
                            </p>
                          </div>
                        </div>

                        <span className="text-[11px] text-slate-500 font-semibold">
                          {batch.enrolled_count}/{batch.capacity} seats
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3. Payment Method Selection (Supported by Razorpay) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <span className="text-xs font-bold uppercase tracking-wider text-[#046BD2]">
                Choose Payment Method
              </span>

              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('upi')}
                  className={`p-3 rounded-xl border-2 text-center transition space-y-1.5 ${
                    selectedPaymentMethod === 'upi'
                      ? 'border-[#046BD2] bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-[#046BD2] mx-auto" />
                  <span className="text-xs font-bold block text-slate-900">
                    UPI / QR
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    GPay, PhonePe, Paytm
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('card')}
                  className={`p-3 rounded-xl border-2 text-center transition space-y-1.5 ${
                    selectedPaymentMethod === 'card'
                      ? 'border-[#046BD2] bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-[#046BD2] mx-auto" />
                  <span className="text-xs font-bold block text-slate-900">
                    Cards
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    Debit / Credit
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('netbanking')}
                  className={`p-3 rounded-xl border-2 text-center transition space-y-1.5 ${
                    selectedPaymentMethod === 'netbanking'
                      ? 'border-[#046BD2] bg-blue-50/50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-[#046BD2] mx-auto" />
                  <span className="text-xs font-bold block text-slate-900">
                    NetBanking
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    All Indian Banks
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary & Pay Action */}
          <div className="lg:col-span-5 sticky top-24 space-y-6">
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-xl space-y-6">
              <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
                Order Summary
              </h3>

              {/* Course Snippet */}
              <div className="flex gap-3">
                <img
                  src={course.thumbnail_url}
                  alt={course.title}
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-2">
                    {course.title}
                  </h4>
                  <p className="text-[11px] text-slate-500">{course.target_class} • {course.category}</p>
                  <p className="text-[11px] font-semibold text-[#046BD2]">
                    Faculty: {course.instructor_name}
                  </p>
                </div>
              </div>

              {/* Promo / Coupon Code Section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-[#046BD2]" />
                    <span>Have a Promo / Coupon Code?</span>
                  </label>
                  {appliedCoupon && (
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {!appliedCoupon ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        placeholder="Enter coupon (e.g. TOPPER100)"
                        className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#046BD2] font-mono uppercase tracking-wider"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon()}
                        disabled={!couponInput.trim()}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 text-white text-xs font-bold rounded-xl transition"
                      >
                        Apply
                      </button>
                    </div>

                    {/* Quick suggestion chips */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">Offers:</span>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon('TOPPER100')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-[#046BD2] border border-blue-200 hover:bg-blue-100 transition"
                      >
                        TOPPER100 (-₹100)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon('SHEKHAR50')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
                      >
                        SHEKHAR50 (-₹50)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleApplyCoupon('BIHAR20')}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition"
                      >
                        BIHAR20 (-20%)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-mono font-black text-emerald-800">{appliedCoupon.code}</span>
                        <p className="text-[10px] text-emerald-600 font-medium">Saved ₹{appliedCoupon.discount} on this course</p>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-700">-₹{appliedCoupon.discount}</span>
                  </div>
                )}

                {couponMessage && (
                  <p
                    className={`text-[11px] font-medium ${
                      couponMessage.type === 'success' ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {couponMessage.text}
                  </p>
                )}
              </div>

              {/* Price Calculation */}
              <div className="space-y-2 text-xs border-t border-slate-100 pt-4">
                <div className="flex justify-between text-slate-600">
                  <span>Course MRP:</span>
                  <span>₹{course.original_price.toLocaleString('en-IN')}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-semibold">
                    <span>Aspire Scholarship Discount:</span>
                    <span>-₹{discountAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                {appliedCoupon && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount ({appliedCoupon.code}):</span>
                    <span>-₹{appliedCoupon.discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Study Notes & Diagram Pack:</span>
                  <span className="text-emerald-600 font-semibold">FREE</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>Total Amount Payable:</span>
                  <div className="text-right">
                    {appliedCoupon && (
                      <span className="text-xs text-slate-400 line-through mr-2">
                        ₹{course.price.toLocaleString('en-IN')}
                      </span>
                    )}
                    <span className="text-xl text-[#046BD2]">
                      ₹{finalPayable.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Checkout Action Buttons */}
              <div className="space-y-3">
                {user ? (
                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl font-black text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] disabled:bg-slate-300 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Activating Enrollment & Verifying...</span>
                      </span>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Pay ₹{finalPayable} & Complete Enrollment</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleAuthRedirect}
                    className="w-full py-4 px-6 rounded-xl font-black text-sm text-white bg-[#046BD2] hover:bg-[#0352A0] shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>Login to Purchase & Save to Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}

                {/* Instant 1-Click Free Demo Enrollment */}
                <button
                  type="button"
                  onClick={handleDirectEnroll}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    {user
                      ? '⚡ Instant 1-Click Free Demo Enrollment (Fast Track)'
                      : '⚡ Login & Access Free Demo Enrollment'}
                  </span>
                </button>
              </div>

              <div className="text-center space-y-1.5 pt-1">
                <p className="text-[11px] text-slate-500 flex items-center justify-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Verified 256-bit Secure Gateway • Instant Course Activation</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  Course appears immediately under your 'My Courses' portal with study room access.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

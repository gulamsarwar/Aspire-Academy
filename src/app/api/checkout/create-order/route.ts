import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db, normalizeStudentId } from '@/lib/data/mock-db';
import { createOrderInDatabase } from '@/lib/data/supabase-service';
import { getRazorpayInstance } from '@/lib/razorpay';
import { calculateCoursePrice } from '@/lib/pricing';

const createOrderSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  batchId: z.string().min(1, 'Batch ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
  couponCode: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = createOrderSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid order payload', details: result.error.format() },
        { status: 400 }
      );
    }

    const { courseId, batchId, studentId: rawStudentId, couponCode } = result.data;
    const studentId = normalizeStudentId(rawStudentId);

    // 1. Validate course exists and is published
    const course = db.getCourseById(courseId);
    if (!course || !course.published) {
      return NextResponse.json(
        { error: 'Course not found or is currently unavailable.' },
        { status: 404 }
      );
    }

    // 2. Validate batch exists and is open
    let batch = db.getBatchById(batchId);
    if (!batch || batch.course_id !== courseId) {
      if (batchId.includes('-batch-default') || batchId.includes('default')) {
        batch = {
          id: batchId,
          course_id: courseId,
          name: 'Regular Target Batch (2026-27)',
          schedule_description: 'Mon, Wed, Fri — 05:00 PM to 06:30 PM',
          start_at: new Date().toISOString(),
          end_at: new Date(Date.now() + 300 * 24 * 3600 * 1000).toISOString(),
          capacity: 150,
          enrolled_count: 0,
          enrollment_open: true,
          instructor_name: course.instructor_name || 'Shekhar Sir',
          created_at: new Date().toISOString(),
        };
        db.batches.unshift(batch);
      } else {
        return NextResponse.json(
          { error: 'Selected batch does not exist for this course.' },
          { status: 400 }
        );
      }
    }

    if (!batch.enrollment_open) {
      return NextResponse.json(
        { error: 'Enrollment for this batch is currently closed.' },
        { status: 400 }
      );
    }

    if (batch.capacity <= batch.enrolled_count) {
      return NextResponse.json(
        { error: 'This batch has reached maximum student capacity. Please choose another batch.' },
        { status: 400 }
      );
    }

    // 3. Centralized server-side pricing and discount calculation
    const pricing = calculateCoursePrice(course, couponCode);
    const finalPrice = pricing.finalPrice;
    const amountInPaise = pricing.amountInPaise;
    const currency = course.currency || 'INR';

    let gatewayOrderId = `order_aspire_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // 4. Try real Razorpay order creation if live keys are configured
    const razorpay = getRazorpayInstance();
    const isRealRazorpay = Boolean(
      razorpay &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_SECRET !== 'rzp_test_aspire_demo_secret' &&
      process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID &&
      !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID.includes('demo')
    );

    if (isRealRazorpay && razorpay) {
      try {
        const rzpOrder = await razorpay.orders.create({
          amount: amountInPaise,
          currency,
          receipt: `rcpt_${Date.now()}`,
          notes: {
            courseId: course.id,
            courseTitle: course.title,
            batchId: batch.id,
            batchName: batch.name,
            studentId,
            couponCode: pricing.couponCode || 'NONE',
          },
        });
        gatewayOrderId = rzpOrder.id;
      } catch (rzpErr: unknown) {
        console.error('Razorpay gateway error, falling back to sandbox order:', rzpErr);
      }
    }

    // 5. Store in internal database orders table
    const order = await createOrderInDatabase({
      studentId,
      courseId,
      batchId,
      amount: finalPrice,
      currency,
      gatewayOrderId,
    });

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_aspire_demo_key';

    return NextResponse.json({
      success: true,
      orderId: order.id,
      gatewayOrderId,
      amount: amountInPaise,
      amountInRupees: finalPrice,
      originalPrice: course.price,
      discountApplied: pricing.discountAmount + pricing.couponDiscount,
      couponApplied: pricing.couponCode,
      currency,
      keyId,
      isRealRazorpay,
      isSandbox: !isRealRazorpay,
      courseTitle: course.title,
      batchName: batch.name,
    });
  } catch (error: any) {
    console.error('Create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error while creating payment order' },
      { status: 500 }
    );
  }
}

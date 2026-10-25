import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/data/mock-db';
import { getRazorpayInstance } from '@/lib/razorpay';

const createOrderSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  batchId: z.string().min(1, 'Batch ID is required'),
  studentId: z.string().min(1, 'Student ID is required'),
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

    const { courseId, batchId, studentId } = result.data;

    // Validate course exists and is published
    const course = db.getCourseById(courseId);
    if (!course || !course.published) {
      return NextResponse.json(
        { error: 'Course not found or is currently unavailable.' },
        { status: 404 }
      );
    }

    // Validate batch exists and is open
    const batch = db.getBatchById(batchId);
    if (!batch || batch.course_id !== courseId) {
      return NextResponse.json(
        { error: 'Selected batch does not exist for this course.' },
        { status: 400 }
      );
    }

    if (!batch.enrollment_open) {
      return NextResponse.json(
        { error: 'Enrollment for this batch is currently closed.' },
        { status: 400 }
      );
    }

    // Server calculates exact amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(course.price * 100);
    const currency = course.currency || 'INR';

    let gatewayOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Try real Razorpay order creation if keys are configured
    const razorpay = getRazorpayInstance();
    if (razorpay && process.env.RAZORPAY_KEY_SECRET !== 'rzp_test_aspire_demo_secret') {
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
          },
        });
        gatewayOrderId = rzpOrder.id;
      } catch (rzpErr: any) {
        console.error('Razorpay gateway error, falling back to sandbox order:', rzpErr);
      }
    }

    // Store in internal database orders table
    const order = db.createOrder({
      studentId,
      courseId,
      batchId,
      amount: course.price,
      currency,
      gatewayOrderId,
    });

    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_aspire_demo_key';

    return NextResponse.json({
      success: true,
      orderId: order.id,
      gatewayOrderId,
      amount: amountInPaise,
      amountInRupees: course.price,
      currency,
      keyId,
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

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { verifyAndActivateEnrollmentInDatabase } from '@/lib/data/supabase-service';
import { db } from '@/lib/data/mock-db';

const verifyPaymentSchema = z.object({
  gatewayOrderId: z.string().min(1, 'Order ID is required'),
  gatewayPaymentId: z.string().min(1, 'Payment ID is required'),
  gatewaySignature: z.string().optional(),
  method: z.string().optional().default('upi'),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const result = verifyPaymentSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid verification data', details: result.error.format() },
        { status: 400 }
      );
    }

    const { gatewayOrderId, gatewayPaymentId, gatewaySignature, method } = result.data;

    // 1. Verify Razorpay cryptographic signature if live secret is configured
    if (
      gatewaySignature &&
      process.env.RAZORPAY_KEY_SECRET &&
      process.env.RAZORPAY_KEY_SECRET !== 'rzp_test_aspire_demo_secret'
    ) {
      const isValid = verifyPaymentSignature({
        orderId: gatewayOrderId,
        paymentId: gatewayPaymentId,
        signature: gatewaySignature,
      });

      if (!isValid) {
        console.error('Cryptographic signature verification failed for order:', gatewayOrderId);
        return NextResponse.json(
          { error: 'Invalid payment signature. Verification failed.' },
          { status: 400 }
        );
      }
    }

    // 2. Activate enrollment idempotently and record verified payment
    const { success, enrollment, order } = await verifyAndActivateEnrollmentInDatabase({
      gatewayOrderId,
      gatewayPaymentId,
      method,
    });

    if (!success || !enrollment) {
      return NextResponse.json(
        { error: 'Could not find pending order or batch for this transaction.' },
        { status: 404 }
      );
    }

    const course = db.getCourseById(enrollment.course_id);
    const batch = db.getBatchById(enrollment.batch_id);

    return NextResponse.json({
      success: true,
      message: 'Payment verified and enrollment activated successfully!',
      enrollmentId: enrollment.id,
      courseId: enrollment.course_id,
      courseTitle: course?.title,
      courseSlug: course?.slug,
      batchId: enrollment.batch_id,
      batchName: batch?.name,
      studentId: enrollment.student_id,
      orderId: order?.id,
      amount: order?.amount,
      status: enrollment.status,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment and activate enrollment' },
      { status: 500 }
    );
  }
}

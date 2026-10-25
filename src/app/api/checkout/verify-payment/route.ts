import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/data/mock-db';
import { verifyPaymentSignature } from '@/lib/razorpay';

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

    // Check signature if secret is active and not default demo
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
        return NextResponse.json(
          { error: 'Invalid payment signature. Verification failed.' },
          { status: 400 }
        );
      }
    }

    // Activate enrollment idempotently
    const { success, enrollment, order } = db.verifyAndActivateEnrollment({
      gatewayOrderId,
      gatewayPaymentId,
      method,
    });

    if (!success || !enrollment) {
      return NextResponse.json(
        { error: 'Could not find pending order for this transaction.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and enrollment activated successfully!',
      enrollmentId: enrollment.id,
      courseId: enrollment.course_id,
      batchId: enrollment.batch_id,
      orderId: order?.id,
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

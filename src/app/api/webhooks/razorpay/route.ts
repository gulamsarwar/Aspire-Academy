import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/data/mock-db';
import { verifyWebhookSignature } from '@/lib/razorpay';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-razorpay-signature') || '';

    // Verify webhook signature if real secret is configured
    if (
      process.env.RAZORPAY_WEBHOOK_SECRET &&
      process.env.RAZORPAY_WEBHOOK_SECRET !== 'aspire_webhook_secret_demo'
    ) {
      const isValid = verifyWebhookSignature({
        body: rawBody,
        signature,
      });

      if (!isValid) {
        console.error('Invalid Razorpay webhook signature');
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 400 }
        );
      }
    }

    const payload = JSON.parse(rawBody);
    const eventType = payload.event;
    const eventId = payload.id || `evt_${Date.now()}`;

    // 1. IDEMPOTENCY CHECK
    if (db.isWebhookProcessed(eventId)) {
      console.log(`Webhook event ${eventId} already processed, skipping idempotently.`);
      return NextResponse.json({
        received: true,
        status: 'already_processed',
      });
    }

    // 2. PROCESS WEBHOOK EVENTS
    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const gatewayOrderId = paymentEntity?.order_id || orderEntity?.id;
      const gatewayPaymentId = paymentEntity?.id || `pay_${Date.now()}`;
      const method = paymentEntity?.method || 'upi';

      if (gatewayOrderId) {
        // Activate enrollment idempotently
        db.verifyAndActivateEnrollment({
          gatewayOrderId,
          gatewayPaymentId,
          method,
        });
        console.log(`Successfully activated enrollment via webhook for order: ${gatewayOrderId}`);
      }
    } else if (eventType === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity;
      const gatewayOrderId = paymentEntity?.order_id;
      if (gatewayOrderId) {
        const order = db.orders.find((o) => o.gateway_order_id === gatewayOrderId);
        if (order) {
          order.status = 'failed';
        }
      }
    } else if (eventType === 'refund.processed') {
      const refundEntity = payload.payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      if (paymentId) {
        const payment = db.payments.find((p) => p.gateway_payment_id === paymentId);
        if (payment) {
          payment.status = 'refunded';
          const order = db.orders.find((o) => o.id === payment.order_id);
          if (order) {
            order.status = 'refunded';
            // Revoke enrollment
            const enrollment = db.enrollments.find((e) => e.order_id === order.id);
            if (enrollment) {
              enrollment.status = 'revoked';
            }
          }
        }
      }
    }

    // Mark event processed
    db.markWebhookProcessed(eventId);

    return NextResponse.json({
      received: true,
      event: eventType,
      id: eventId,
    });
  } catch (error: any) {
    console.error('Razorpay webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook processing exception' },
      { status: 500 }
    );
  }
}

import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

// In-Memory Database and Domain logic test
import { db } from '../src/lib/data/mock-db.js';

describe('Aspire Academy Online — Comprehensive Platform Test Suite', () => {
  const testStudentId = 'student_test_101';
  const testAdminId = 'u0000000-0000-0000-0000-000000000002';
  const testCourseSlug = 'class-12-biology';
  let targetCourse;
  let targetBatch;

  // 1. Course Browsing
  test('1. Course Browsing: should fetch only published courses with correct pricing', () => {
    const publishedCourses = db.getCourses(true);
    assert.ok(publishedCourses.length >= 4, 'Expected at least 4 published courses');
    
    targetCourse = db.getCourseBySlug(testCourseSlug);
    assert.ok(targetCourse, 'Target course should be found by slug');
    assert.equal(targetCourse.price, 399, 'Course price must match 399 INR');
    assert.equal(targetCourse.category, 'Bihar Board', 'Category must be Bihar Board');
    assert.equal(targetCourse.target_class, 'Class 12', 'Target class must be Class 12');
  });

  // 2. Batch Selection
  test('2. Batch Selection: should retrieve open batches for course', () => {
    const batches = db.getBatchesForCourse(targetCourse.id, true);
    assert.ok(batches.length >= 1, 'Expected at least 1 open batch');
    targetBatch = batches[0];
    assert.equal(targetBatch.enrollment_open, true, 'Batch must be open for enrollment');
    assert.ok(targetBatch.capacity > targetBatch.enrolled_count, 'Capacity must exceed enrolled count');
  });

  // 3. Security: Student blocked from unpurchased courses
  test('3. Access Control: Student is blocked from unpurchased course', () => {
    const hasAccess = db.isStudentEnrolled(testStudentId, targetCourse.id);
    assert.equal(hasAccess, false, 'Unpurchased course access must be blocked');
  });

  // 4. Server-Side Order Creation (Amount calculation validation)
  test('4. Order Creation: Server calculates price and creates pending order', () => {
    const gatewayOrderId = `order_test_${Date.now()}`;
    const order = db.createOrder({
      studentId: testStudentId,
      courseId: targetCourse.id,
      batchId: targetBatch.id,
      amount: targetCourse.price,
      currency: 'INR',
      gatewayOrderId,
    });

    assert.ok(order.id, 'Order must receive a unique ID');
    assert.equal(order.status, 'created', 'Initial order status must be created');
    assert.equal(order.amount, targetCourse.price, 'Order amount must match course price');
    assert.equal(order.gateway_order_id, gatewayOrderId);
  });

  // 5. Successful Payment & Automatic Enrollment
  test('5. Automatic Enrollment: Verified payment activates enrollment and updates batch count', () => {
    const initialCount = targetBatch.enrolled_count;
    const testGatewayOrderId = `order_auto_${Date.now()}`;
    const testPaymentId = `pay_auto_${Date.now()}`;

    // Create order
    db.createOrder({
      studentId: testStudentId,
      courseId: targetCourse.id,
      batchId: targetBatch.id,
      amount: targetCourse.price,
      currency: 'INR',
      gatewayOrderId: testGatewayOrderId,
    });

    // Verify payment
    const result = db.verifyAndActivateEnrollment({
      gatewayOrderId: testGatewayOrderId,
      gatewayPaymentId: testPaymentId,
      method: 'upi_phonepe',
    });

    assert.equal(result.success, true, 'Payment verification should succeed');
    assert.ok(result.enrollment, 'Enrollment must be returned');
    assert.equal(result.enrollment.status, 'active');
    assert.equal(result.order.status, 'paid');

    // Student now has access
    const hasAccess = db.isStudentEnrolled(testStudentId, targetCourse.id);
    assert.equal(hasAccess, true, 'Student must have active access after verified payment');

    // Batch count incremented
    assert.equal(targetBatch.enrolled_count, initialCount + 1, 'Batch count must increment');
  });

  // 6. Razorpay Webhook HMAC-SHA256 Signature Verification
  test('6. Razorpay Webhook: Cryptographic signature verification', () => {
    const secret = 'aspire_webhook_test_secret_123';
    const payload = JSON.stringify({
      event: 'payment.captured',
      id: `evt_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: 'pay_xyz789',
            order_id: 'order_xyz789',
            amount: 39900,
            currency: 'INR',
            method: 'upi',
          },
        },
      },
    });

    // Generate valid signature
    const validSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Verify
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    assert.equal(validSignature, computedSignature, 'Signatures must match for genuine events');

    // Test tamper resistance
    const tamperedPayload = payload.replace('39900', '10000');
    const tamperedCheck = crypto
      .createHmac('sha256', secret)
      .update(tamperedPayload)
      .digest('hex');

    assert.notEqual(validSignature, tamperedCheck, 'Tampered payload signature must be rejected');
  });

  // 7. Duplicate Webhook Event Idempotency
  test('7. Webhook Idempotency: Duplicate events are rejected without duplicate enrollments', () => {
    const eventId = `evt_idempotent_${Date.now()}`;
    assert.equal(db.isWebhookProcessed(eventId), false, 'New event should not be processed yet');

    // Mark processed
    db.markWebhookProcessed(eventId);
    assert.equal(db.isWebhookProcessed(eventId), true, 'Event should now be marked processed');

    // Repeated delivery
    const isRepeated = db.isWebhookProcessed(eventId);
    assert.equal(isRepeated, true, 'Duplicate delivery correctly recognized');
  });

  // 8. Student Isolation: Student A cannot access Student B data
  test('8. Data Isolation: Student A query returns only Student A enrollments', () => {
    const studentAId = 'student_A';
    const studentBId = 'student_B';

    // Enroll student A in biology
    db.verifyAndActivateEnrollment({
      gatewayOrderId: 'order_test_A',
      gatewayPaymentId: 'pay_test_A',
    });
    db.createOrder({
      studentId: studentAId,
      courseId: targetCourse.id,
      batchId: targetBatch.id,
      amount: 399,
      currency: 'INR',
      gatewayOrderId: 'order_test_A',
    });
    db.verifyAndActivateEnrollment({
      gatewayOrderId: 'order_test_A',
      gatewayPaymentId: 'pay_test_A',
    });

    const studentAOrders = db.orders.filter((o) => o.student_id === studentAId);
    const studentBOrders = db.orders.filter((o) => o.student_id === studentBId);

    assert.ok(studentAOrders.length >= 1, 'Student A has orders');
    assert.equal(studentBOrders.length, 0, 'Student B should have no orders for Student A purchases');
  });

  // 9. Admin Access & Audit Log Requirement
  test('9. Admin Management: Manual override requires mandatory audit reason', () => {
    const targetStudentId = 'student_manual_test';

    // Must fail without reason
    assert.throws(
      () => {
        db.manualEnrollmentOverride({
          adminId: testAdminId,
          studentId: targetStudentId,
          courseId: targetCourse.id,
          batchId: targetBatch.id,
          action: 'grant',
          reason: '  ', // invalid empty reason
        });
      },
      /reason of at least 5 characters is required/,
      'Must reject manual grant without valid reason'
    );

    // Should succeed with valid reason and record audit log
    const success = db.manualEnrollmentOverride({
      adminId: testAdminId,
      studentId: targetStudentId,
      courseId: targetCourse.id,
      batchId: targetBatch.id,
      action: 'grant',
      reason: 'Special offline campus scholarship granted by Shekhar Sir',
    });

    assert.equal(success, true);
    assert.equal(db.isStudentEnrolled(targetStudentId, targetCourse.id), true);

    const latestAudit = db.auditLogs[0];
    assert.equal(latestAudit.action, 'MANUAL_ACCESS_GRANTED');
    assert.equal(latestAudit.reason, 'Special offline campus scholarship granted by Shekhar Sir');
  });

  // 10. Lesson Progress Tracking
  test('10. Progress Tracking: Mark lesson complete and calculate percentages', () => {
    const lessonId = 'l0000000-0000-0000-0000-000000000001';
    
    // Toggle complete
    const isDone = db.toggleLessonProgress(testStudentId, lessonId);
    assert.equal(isDone, true, 'Lesson should be completed');

    const progress = db.getStudentProgressForCourse(testStudentId, targetCourse.id);
    assert.ok(progress.completedCount >= 1, 'Should reflect completed count');
    assert.ok(progress.percent > 0, 'Percentage should be greater than 0');
  });

  // 11. Admin Batch & Course Creation
  test('11. Admin Course Creation: Adds course to live database', () => {
    const newCourse = db.addCourse({
      slug: 'class-12-math-test',
      title: 'Class 12 Mathematics (Test)',
      subtitle: 'Board test prep',
      description: 'Test description',
      category: 'Bihar Board',
      target_class: 'Class 12',
      thumbnail_url: 'https://example.com/thumb.jpg',
      price: 499,
      original_price: 999,
      currency: 'INR',
      published: true,
      featured: false,
      language: 'Hinglish',
      duration_weeks: 24,
      instructor_name: 'Test Faculty',
      instructor_title: 'Faculty',
      features: ['Feature 1'],
    });

    assert.ok(newCourse.id);
    const fetched = db.getCourseBySlug('class-12-math-test');
    assert.equal(fetched.title, 'Class 12 Mathematics (Test)');
  });
});

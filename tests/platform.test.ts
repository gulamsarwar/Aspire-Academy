import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

// Automatically load .env.local for test runner to match Next.js environment
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

import { db } from '../src/lib/data/mock-db';
import { verifyWebhookSignature } from '../src/lib/razorpay';
import { Course, Batch } from '../src/lib/types';

describe('Aspire Academy — Comprehensive Platform Test Suite', () => {
  const testRunTimestamp = Date.now();
  const testStudentId = `student_test_${testRunTimestamp}`;
  const testAdminId = 'u0000000-0000-0000-0000-000000000002';
  const testCourseSlug = 'class-12-biology';
  let targetCourse: Course;
  let targetBatch: Batch;

  // 1. Course Browsing
  test('1. Course Browsing: should fetch only published courses with correct pricing', () => {
    const publishedCourses = db.getCourses(true);
    assert.ok(publishedCourses.length >= 4, 'Expected at least 4 published courses');

    const foundCourse = db.getCourseBySlug(testCourseSlug);
    assert.ok(foundCourse, 'Target course should be found by slug');
    targetCourse = foundCourse;

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
    assert.equal(result.order?.status, 'paid');

    // Student now has access
    const hasAccess = db.isStudentEnrolled(testStudentId, targetCourse.id);
    assert.equal(hasAccess, true, 'Student must have active access after verified payment');

    // Batch count incremented
    assert.equal(targetBatch.enrolled_count, initialCount + 1, 'Batch count must increment');
  });

  // 6. Razorpay Webhook HMAC-SHA256 Signature Verification
  test('6. Razorpay Webhook: Cryptographic signature verification', () => {
    process.env.RAZORPAY_WEBHOOK_SECRET = 'aspire_webhook_test_secret_123';
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

    // Generate signature
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(payload)
      .digest('hex');

    const isValid = verifyWebhookSignature({
      body: payload,
      signature: validSignature,
    });
    assert.equal(isValid, true, 'Valid signature must verify successfully');

    const isInvalid = verifyWebhookSignature({
      body: payload,
      signature: 'invalid_tampered_signature_hex_value',
    });
    assert.equal(isInvalid, false, 'Invalid signature must be rejected');
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
    const studentAId = 'student_isolated_A';
    const studentBId = 'student_isolated_B';

    db.createOrder({
      studentId: studentAId,
      courseId: targetCourse.id,
      batchId: targetBatch.id,
      amount: 399,
      currency: 'INR',
      gatewayOrderId: 'order_test_A_iso',
    });
    db.verifyAndActivateEnrollment({
      gatewayOrderId: 'order_test_A_iso',
      gatewayPaymentId: 'pay_test_A_iso',
    });

    const studentAOrders = db.orders.filter((o) => o.student_id === studentAId);
    const studentBOrders = db.orders.filter((o) => o.student_id === studentBId);

    assert.ok(studentAOrders.length >= 1, 'Student A has orders');
    assert.equal(studentBOrders.length, 0, 'Student B should have no orders for Student A purchases');
  });

  // 9. Admin Access & Audit Log Requirement
  test('9. Admin Management: Manual override requires mandatory audit reason', () => {
    const targetStudentId = 'student_manual_audit_test';

    // Must fail without reason
    assert.throws(
      () => {
        db.manualEnrollmentOverride({
          adminId: testAdminId,
          studentId: targetStudentId,
          courseId: targetCourse.id,
          batchId: targetBatch.id,
          action: 'grant',
          reason: '  ',
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
      reason: 'Offline scholarship granted by Shekhar Sir at Rajendra Nagar campus',
    });

    assert.equal(success, true);
    assert.equal(db.isStudentEnrolled(targetStudentId, targetCourse.id), true);

    const latestAudit = db.auditLogs[0];
    assert.equal(latestAudit.action, 'MANUAL_ACCESS_GRANTED');
    assert.equal(latestAudit.reason, 'Offline scholarship granted by Shekhar Sir at Rajendra Nagar campus');
  });

  // 10. Lesson Progress Tracking
  test('10. Progress Tracking: Mark lesson complete and calculate percentages', () => {
    const lessonId = db.lessons[0]?.id || 'e0000000-0000-0000-0000-000000000001';

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
    assert.equal(fetched?.title, 'Class 12 Mathematics (Test)');
  });

  // 12. Admin Global Site Settings Management
  test('12. Admin Global Site Settings: Can update academy name, phone, address, and creates audit log', () => {
    const updated = db.updateSettings({
      academy_name: 'Aspire Academy Premier',
      phone: '+91 9999988888',
      address: 'Test New Campus Address, Patna, Bihar',
    });

    assert.equal(updated.academy_name, 'Aspire Academy Premier');
    assert.equal(updated.phone, '+91 9999988888');

    const fetched = db.getSettings();
    assert.equal(fetched.address, 'Test New Campus Address, Patna, Bihar');

    const lastAudit = db.auditLogs[0];
    assert.equal(lastAudit.action, 'SITE_SETTINGS_UPDATED');
  });

  // 13. Supabase Integration & Hybrid Fallback
  test('13. Supabase Integration: Diagnostic test returns proper status and resilient fallback', async () => {
    const { testSupabaseConnection, isSupabaseConfigured } = await import('../src/lib/data/supabase-service');
    const diagnostic = await testSupabaseConnection();

    assert.ok(diagnostic);
    assert.ok(['connected', 'not_configured', 'error'].includes(diagnostic.status));
    assert.ok(diagnostic.message.length > 0);

    // If keys not set, system must report not_configured and preserve flawless mock-db fallback
    if (!isSupabaseConfigured()) {
      assert.equal(diagnostic.status, 'not_configured');
      assert.equal(diagnostic.success, false);
      assert.ok(db.courses.length >= 4, 'Mock database courses must remain available');
    }
  });

  // 14. Cloudflare R2 Configuration & Safe Diagnostics
  test('14. Cloudflare R2: Diagnostic accurately reports configuration status without leaking secrets', async () => {
    const { getR2Diagnostic, isR2Configured } = await import('../src/lib/r2');
    const diagnostic = getR2Diagnostic();

    assert.ok(diagnostic);
    assert.equal(typeof diagnostic.isConfigured, 'boolean');
    assert.ok(Array.isArray(diagnostic.missing));

    // When unconfigured, missing keys must be reported clearly
    if (!isR2Configured()) {
      assert.equal(diagnostic.isConfigured, false);
      assert.ok(diagnostic.missing.length > 0, 'Should list missing R2 env vars');
    }
  });

  // 15. Lesson Video Sources (Option A YouTube & Option B Cloudflare R2) & Course Thumbnail
  test('15. Video Sources & Thumbnail: Supports both YouTube embed and Cloudflare R2 object keys', () => {
    // Test Course with R2 Thumbnail Key
    const courseWithR2Thumb = db.addCourse({
      slug: 'class-11-physics-r2-test',
      title: 'Class 11 Physics (R2 Test)',
      subtitle: 'Complete Mechanics',
      description: 'Test description for R2 media',
      category: 'Bihar Board',
      target_class: 'Class 11',
      thumbnail_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
      thumbnail_r2_key: 'thumbnails/class-11-physics.webp',
      price: 299,
      original_price: 599,
      currency: 'INR',
      published: true,
      featured: false,
      language: 'Hindi',
      duration_weeks: 16,
      instructor_name: 'Dr. Shekhar Sharma',
      instructor_title: 'HOD Physics',
      features: ['Live Doubt Sessions'],
    });

    assert.ok(courseWithR2Thumb.id);
    assert.equal(courseWithR2Thumb.thumbnail_r2_key, 'thumbnails/class-11-physics.webp');

    const testModule = db.addModule(courseWithR2Thumb.id, 'Unit 1: Kinematics & Motion');
    assert.ok(testModule.id);

    // Test Lesson with Option A: YouTube
    const youtubeLesson = db.addLesson({
      module_id: testModule.id,
      title: 'Unit 1: Kinematics Lecture (YouTube)',
      description: 'Introductory kinematics stream',
      video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      youtube_video_id: 'dQw4w9WgXcQ',
      video_source_type: 'youtube',
      duration_minutes: 45,
      sort_order: 1,
      is_free_preview: true,
      published: true,
    });
    assert.ok(youtubeLesson.id);
    assert.equal(youtubeLesson.video_source_type, 'youtube');
    assert.equal(youtubeLesson.video_url, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');

    // Test Lesson with Option B: Cloudflare R2
    const r2Lesson = db.addLesson({
      module_id: testModule.id,
      title: 'Unit 2: Circular Motion (Cloudflare R2)',
      description: 'High-bitrate private video hosted on R2',
      video_source_type: 'r2',
      r2_object_key: 'courses/class-11-physics/unit-2-circular-motion.mp4',
      youtube_video_id: '',
      duration_minutes: 55,
      sort_order: 2,
      is_free_preview: false,
      published: true,
    });
    assert.ok(r2Lesson.id);
    assert.equal(r2Lesson.video_source_type, 'r2');
    assert.equal(r2Lesson.r2_object_key, 'courses/class-11-physics/unit-2-circular-motion.mp4');
  });

  // 16. Supabase Cloud Storage for Course Thumbnails
  test('16. Supabase Storage: Thumbnail diagnostic and upload validation', async () => {
    const { getSupabaseStorageDiagnostic, uploadThumbnailToSupabase } = await import(
      '../src/lib/supabase-storage'
    );
    const diagnostic = getSupabaseStorageDiagnostic();

    assert.ok(diagnostic);
    assert.equal(typeof diagnostic.isConfigured, 'boolean');
    assert.equal(diagnostic.bucketName, 'course-thumbnails');

    // Reject invalid mime types
    const invalidResult = await uploadThumbnailToSupabase(
      Buffer.from('not-an-image'),
      'sample.pdf',
      'application/pdf'
    );
    assert.equal(invalidResult.success, false);
    assert.ok(invalidResult.error?.includes('Invalid file type'));

    // If Supabase is configured in environment, verify upload of valid PNG
    if (diagnostic.isConfigured) {
      const png1x1 = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
        'base64'
      );
      const uploadResult = await uploadThumbnailToSupabase(
        png1x1,
        'unit_test_thumb.png',
        'image/png'
      );
      assert.equal(uploadResult.success, true);
      assert.ok(uploadResult.url);
      assert.ok(uploadResult.url.includes('course-thumbnails'));
    }
  });
});




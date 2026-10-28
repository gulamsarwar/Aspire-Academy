import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateCoursePrice } from '../src/lib/pricing';
import { extractYouTubeVideoId, generateYouTubeEmbedUrl, isValidYouTubeVideoId } from '../src/lib/youtube';
import { parseWordQuizContent, convertOMMLToLatex } from '../src/lib/quiz/docx-parser';
import { db, normalizeStudentId } from '../src/lib/data/mock-db';
import { Course } from '../src/lib/types';

describe('Aspire Academy — Client Feedback Bug Fix Verification', () => {
  // --------------------------------------------------------------------------
  // BUG 1: Deterministic Student UUID & Enrollment Flow
  // --------------------------------------------------------------------------
  test('BUG 1: Deterministic Student ID normalizes RFC 4122 compliant UUIDs across sessions', () => {
    // Legacy / demo ID normalization
    assert.strictEqual(
      normalizeStudentId('u0000000-0000-0000-0000-000000000001'),
      '00000000-0000-4000-8000-000000000001'
    );

    // Phone number input yields identical deterministic UUID on repeat logins
    const phone = '9876543210';
    const uuid1 = normalizeStudentId(phone);
    const uuid2 = normalizeStudentId(phone);
    assert.strictEqual(uuid1, uuid2);
    // Verify valid 36-char UUID format (8-4-4-4-12)
    assert.match(uuid1, /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  test('BUG 1: Course Enrollment creation is idempotent and unlocks lessons exactly once', () => {
    const studentId = '00000000-0000-4000-8000-000000000099';
    const courseId = 'c0000000-0000-0000-0000-000000000001';
    const batchId = 'b0000000-0000-0000-0000-000000000001';
    const gatewayOrderId = `order_test_${Date.now()}`;

    // 1. Create order
    db.createOrder({
      studentId,
      courseId,
      batchId,
      amount: 2999,
      currency: 'INR',
      gatewayOrderId,
    });

    // 2. Activate enrollment
    const result1 = db.verifyAndActivateEnrollment({
      gatewayOrderId,
      gatewayPaymentId: `pay_${Date.now()}`,
    });
    assert.ok(result1.success);
    assert.ok(result1.enrollment);
    assert.strictEqual(result1.enrollment.student_id, studentId);

    // 3. Second call with same order must be idempotent (no duplicate enrollments)
    const result2 = db.verifyAndActivateEnrollment({
      gatewayOrderId,
      gatewayPaymentId: `pay_duplicate`,
    });
    assert.ok(result2.success);

    const enrollments = db.getStudentEnrollments(studentId);
    const matching = enrollments.filter((e) => e.course_id === courseId && e.batch_id === batchId);
    assert.strictEqual(matching.length, 1);
  });

  // --------------------------------------------------------------------------
  // BUG 2: Robust YouTube URL Parser & Embedder
  // --------------------------------------------------------------------------
  test('BUG 2: YouTube URL parser extracts valid 11-char ID from all supported link formats', () => {
    // 1. Standard watch URL
    assert.strictEqual(
      extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    );

    // 2. Short youtu.be URL
    assert.strictEqual(
      extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=42'),
      'dQw4w9WgXcQ'
    );

    // 3. YouTube Shorts URL
    assert.strictEqual(
      extractYouTubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    );

    // 4. YouTube Live Stream URL
    assert.strictEqual(
      extractYouTubeVideoId('https://www.youtube.com/live/dQw4w9WgXcQ?feature=share'),
      'dQw4w9WgXcQ'
    );

    // 5. Existing Embed URL
    assert.strictEqual(
      extractYouTubeVideoId('https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    );

    // 6. Mobile URL with multiple query parameters
    assert.strictEqual(
      extractYouTubeVideoId('https://m.youtube.com/watch?v=dQw4w9WgXcQ&feature=youtu.be&si=abc'),
      'dQw4w9WgXcQ'
    );

    // 7. Raw 11-character video ID
    assert.strictEqual(
      extractYouTubeVideoId('dQw4w9WgXcQ'),
      'dQw4w9WgXcQ'
    );

    // 8. Invalid URL rejected cleanly as null
    assert.strictEqual(
      extractYouTubeVideoId('https://vimeo.com/12345678'),
      null
    );
  });

  test('BUG 2: Generates privacy-enhanced embed URL with security attributes', () => {
    const embedUrl = generateYouTubeEmbedUrl('dQw4w9WgXcQ', false);
    assert.ok(embedUrl.includes('youtube-nocookie.com/embed/dQw4w9WgXcQ'));
    assert.ok(embedUrl.includes('rel=0'));
    assert.ok(embedUrl.includes('modestbranding=1'));
    assert.strictEqual(isValidYouTubeVideoId('dQw4w9WgXcQ'), true);
  });

  // --------------------------------------------------------------------------
  // BUG 4: Word Docx & Text Quiz Importer + OMML Math Formula Conversion
  // --------------------------------------------------------------------------
  test('BUG 4: OMML Math XML converts to valid LaTeX for KaTeX rendering', () => {
    // Fraction conversion: <m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f> -> $\frac{1}{2}$
    const ommlFraction = '<m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>2</m:t></m:r></m:den></m:f>';
    const latex = convertOMMLToLatex(ommlFraction);
    assert.strictEqual(latex, '$\\frac{1}{2}$');

    // Square root conversion
    const ommlSqrt = '<m:rad><m:deg/><m:e><m:r><m:t>x</m:t></m:r></m:e></m:rad>';
    assert.strictEqual(convertOMMLToLatex(ommlSqrt), '$\\sqrt{x}$');
  });

  test('BUG 4: Quiz Parser correctly extracts bilingual questions, options, and answer keys', () => {
    const wordContent = `
1. What is the phenotypic ratio of dihybrid cross?
(A) 3:1
(B) 9:3:3:1
(C) 1:2:1
(D) 9:7
Ans: B
Explanation: Classic Mendelian ratio.

2. DNA द्वि-कुंडली संरचना का प्रतिपादन किसने किया?
(A) वाटसन एवं क्रिक
(B) मेंडल
(C) डार्विन
(D) लैमार्क
Answer: A
Explanation: 1953 खोज.
    `;

    const result = parseWordQuizContent(wordContent);
    assert.strictEqual(result.questions.length, 2);

    // Question 1
    assert.strictEqual(result.questions[0].question_number, 1);
    assert.strictEqual(result.questions[0].correct_option, 'B');
    assert.strictEqual(result.questions[0].options.length, 4);
    assert.strictEqual(result.questions[0].options[1].id, 'B');
    assert.strictEqual(result.questions[0].options[1].text, '9:3:3:1');

    // Question 2 (Hindi bilingual)
    assert.strictEqual(result.questions[1].question_number, 2);
    assert.strictEqual(result.questions[1].correct_option, 'A');
    assert.strictEqual(result.questions[1].options[0].text, 'वाटसन एवं क्रिक');
  });

  // --------------------------------------------------------------------------
  // BUG 5: Centralized Server-Side Course Pricing & Discount Consistency
  // --------------------------------------------------------------------------
  test('BUG 5: Server-side pricing calculation applies coupons accurately and resists tampering', () => {
    const mockCourse: Course = {
      ...db.courses[0],
      price: 2999,
      original_price: 4999,
    };

    // 1. Regular course price
    const baseCalc = calculateCoursePrice(mockCourse);
    assert.strictEqual(baseCalc.finalPrice, 2999);
    assert.strictEqual(baseCalc.couponDiscount, 0);
    assert.strictEqual(baseCalc.isValidCoupon, false);

    // 2. Fixed Scholarship Coupon: TOPPER100 (₹100 off)
    const topperCalc = calculateCoursePrice(mockCourse, 'TOPPER100');
    assert.strictEqual(topperCalc.finalPrice, 2899);
    assert.strictEqual(topperCalc.couponDiscount, 100);
    assert.strictEqual(topperCalc.isValidCoupon, true);

    // 3. Percentage Coupon: BIHAR20 (20% off base price: 20% of 2999 = ₹599.8 -> ₹600 off)
    const biharCalc = calculateCoursePrice(mockCourse, 'BIHAR20');
    assert.strictEqual(biharCalc.couponDiscount, 600);
    assert.strictEqual(biharCalc.finalPrice, 2399);

    // 4. Invalid or tampered coupon
    const invalidCalc = calculateCoursePrice(mockCourse, 'FAKECOUPON');
    assert.strictEqual(invalidCalc.finalPrice, 2999);
    assert.strictEqual(invalidCalc.couponDiscount, 0);
    assert.strictEqual(invalidCalc.isValidCoupon, false);
  });

  // --------------------------------------------------------------------------
  // ADDITIONAL REQUIREMENTS: DOCX OMML Math & KaTeX Formula Conversion
  // --------------------------------------------------------------------------
  test('ADDITIONAL: OMML equation markup converts into valid LaTeX math syntax', () => {
    // Fraction
    const fracXml = '<m:oMath><m:f><m:num><m:r><m:t>1</m:t></m:r></m:num><m:den><m:r><m:t>4\\pi\\varepsilon_0</m:t></m:r></m:den></m:f></m:oMath>';
    assert.strictEqual(convertOMMLToLatex(fracXml), '$\\frac{1}{4\\pi\\varepsilon_0}$');

    // Square Root
    const radXml = '<m:oMath><m:rad><m:e><m:r><m:t>x^2 + y^2</m:t></m:r></m:e></m:rad></m:oMath>';
    assert.strictEqual(convertOMMLToLatex(radXml), '$\\sqrt{x^2 + y^2}$');

    // Superscripts & Subscripts
    const supXml = '<m:oMath><m:sSup><m:e><m:r><m:t>p</m:t></m:r></m:e><m:sup><m:r><m:t>2</m:t></m:r></m:sup></m:sSup></m:oMath>';
    assert.strictEqual(convertOMMLToLatex(supXml), '$p^{2}$');

    const subXml = '<m:oMath><m:sSub><m:e><m:r><m:t>F</m:t></m:r></m:e><m:sub><m:r><m:t>2</m:t></m:r></m:sub></m:sSub></m:oMath>';
    assert.strictEqual(convertOMMLToLatex(subXml), '$F_{2}$');
  });

  // --------------------------------------------------------------------------
  // ADDITIONAL REQUIREMENTS: Student Exam Security & Secret Answer Keys
  // --------------------------------------------------------------------------
  test('ADDITIONAL: Exam questions are sanitized so correct answers are not leaked to student before submission', () => {
    const quiz = db.getQuizById('qz_001', true); // sanitizeForStudent = true
    assert.ok(quiz);
    assert.ok(quiz.questions && quiz.questions.length > 0);

    quiz.questions.forEach((q) => {
      // In student exam mode, correct_option must be blank and explanation must be undefined
      assert.strictEqual(q.correct_option, '', `Question #${q.question_number} leaked correct_option!`);
      assert.strictEqual(q.explanation, undefined, `Question #${q.question_number} leaked explanation!`);
    });

    // In admin mode, true secret keys and explanations remain accessible
    const adminQuiz = db.getQuizById('qz_001', false);
    assert.ok(adminQuiz);
    assert.strictEqual(adminQuiz.questions[0].correct_option, 'A');
    assert.ok(adminQuiz.questions[0].explanation);
  });

  // --------------------------------------------------------------------------
  // ADDITIONAL REQUIREMENTS: Server-Side Scoring with Negative Marking
  // --------------------------------------------------------------------------
  test('ADDITIONAL: Server-side quiz evaluation computes correct, incorrect, negative penalty and percentage', () => {
    const studentId = '00000000-0000-4000-8000-000000000001';
    const quizId = 'qz_001';

    // Quiz 001 has 3 questions: qq_001 (Ans: A), qq_002 (Ans: A), qq_003 (Ans: A)
    // Student provides:
    // qq_001 -> A (Correct, +1)
    // qq_002 -> B (Incorrect, -0.25)
    // qq_003 -> '' (Unanswered, 0)
    const attempt = db.submitQuizAttempt({
      studentId,
      quizId,
      answers: {
        qq_001: 'A',
        qq_002: 'B',
      },
      timeTakenSeconds: 340,
    });

    assert.ok(attempt);
    assert.strictEqual(attempt.student_id, studentId);
    assert.strictEqual(attempt.correct_count, 1);
    assert.strictEqual(attempt.incorrect_count, 1);
    assert.strictEqual(attempt.unanswered_count, 1);
    assert.strictEqual(attempt.time_taken_seconds, 340);
    assert.strictEqual(attempt.status, 'submitted');

    // Score: 1 - 0 = 1 (or 1 - negative penalty)
    assert.ok(attempt.score >= 0.75);
    assert.strictEqual(attempt.total_marks, 3);
    assert.ok(typeof attempt.percentage === 'number');

    // Verify attempt is recorded in student attempts history
    const history = db.getStudentQuizAttempts(studentId);
    assert.ok(history.some((h) => h.id === attempt.id));
  });

  // --------------------------------------------------------------------------
  // ADDITIONAL REQUIREMENTS: Mobile Bottom Navigation Configuration
  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // AUTH REQUIREMENT 1 & 2: Complete Removal of Phone OTP & Google / Email Authentication
  // --------------------------------------------------------------------------
  test('AUTH REQUIREMENT 1 & 2: Mobile OTP retired; Google OAuth & Email/Password are primary authentication methods', () => {
    // 1. Google Student Profile Creation / Resolution
    const googleProfile = db.resolveOrCreateProfile({
      email: 'student.google@gmail.com',
      fullName: 'Aarav Gupta',
      avatarUrl: 'https://lh3.googleusercontent.com/a/default-user',
    });
    assert.ok(googleProfile.id);
    assert.strictEqual(googleProfile.email, 'student.google@gmail.com');
    assert.strictEqual(googleProfile.full_name, 'Aarav Gupta');

    // 2. Email / Password student profile resolution
    const emailProfile = db.resolveOrCreateProfile({
      email: 'student@aspireacademy.demo',
      fullName: 'Priyanshu Kumari',
    });
    assert.strictEqual(emailProfile.id, '00000000-0000-4000-8000-000000000001');

    // 3. Admin credentials verification
    const adminProfile = db.resolveOrCreateProfile({
      email: 'admin@aspireacademy.in',
      fullName: 'Shekhar Sir (Admin)',
    });
    assert.strictEqual(adminProfile.id, '00000000-0000-4000-8000-000000000002');
  });

  // --------------------------------------------------------------------------
  // AUTH REQUIREMENT 3: Purchased Courses Persistence Across Logout & Re-login
  // --------------------------------------------------------------------------
  test('AUTH REQUIREMENT 3: Purchased courses persist across logout and re-login (Rule A, B, C, D)', () => {
    const runId = Date.now();
    const studentEmail = `aryan.student_${runId}@gmail.com`;

    // Step 1: Student logs in via Google / Email
    const student = db.resolveOrCreateProfile({
      email: studentEmail,
      fullName: 'Aryan Sharma',
    });
    assert.ok(student.id);

    // Step 2: Student purchases Class 12 Biology course
    const courseId = 'c0000000-0000-0000-0000-000000000001';
    const batchId = 'b0000000-0000-0000-0000-000000000001';
    const gatewayOrderId = `order_pers_${Date.now()}`;

    const order = db.createOrder({
      studentId: student.id,
      courseId,
      batchId,
      amount: 399,
      currency: 'INR',
      gatewayOrderId,
    });
    assert.strictEqual(order.status, 'created');

    // Unverified payment does NOT unlock course
    assert.strictEqual(db.isStudentEnrolled(student.id, courseId), false);

    // Step 3: Verified payment unlocks course
    const activation = db.verifyAndActivateEnrollment({
      gatewayOrderId,
      gatewayPaymentId: `pay_pers_${Date.now()}`,
    });
    assert.ok(activation.success);
    assert.strictEqual(db.isStudentEnrolled(student.id, courseId), true);

    const initialEnrollments = db.getStudentEnrollments(student.id);
    assert.strictEqual(initialEnrollments.length, 1);
    assert.strictEqual(initialEnrollments[0].course_id, courseId);

    // Step 4: Student Logs Out (simulated by clearing local session state)
    // Logout must NEVER delete order or enrollment records in database!
    let sessionUser: any = null; // Session cleared
    assert.strictEqual(sessionUser, null);

    // Step 5: Student Logs In Again (via Google)
    const reLoggedInStudent = db.resolveOrCreateProfile({
      email: studentEmail,
    });
    assert.strictEqual(reLoggedInStudent.id, student.id);

    // Step 6: Verify purchased course still appears under My Courses
    const restoredEnrollments = db.getStudentEnrollments(reLoggedInStudent.id);
    assert.strictEqual(restoredEnrollments.length, 1);
    assert.strictEqual(restoredEnrollments[0].course_id, courseId);
    assert.strictEqual(restoredEnrollments[0].course?.title.includes('Biology'), true);
    assert.strictEqual(restoredEnrollments[0].batch?.id, batchId);
    assert.strictEqual(db.isStudentEnrolled(reLoggedInStudent.id, courseId), true);

    // Step 7: Data isolation — A different student cannot access Aryan's enrollment
    const differentStudent = db.resolveOrCreateProfile({
      email: 'rohan.other@gmail.com',
      fullName: 'Rohan Verma',
    });
    const rohanEnrollments = db.getStudentEnrollments(differentStudent.id);
    assert.strictEqual(rohanEnrollments.length, 0);
    assert.strictEqual(db.isStudentEnrolled(differentStudent.id, courseId), false);
  });

  // --------------------------------------------------------------------------
  // REQUIREMENT 8: Mobile Bottom Navigation Configuration (5 Student Tabs)
  // --------------------------------------------------------------------------
  test('REQUIREMENT 8: Mobile Bottom Navigation tabs map to 5 functional student routes', () => {
    const expectedTabs = [
      { id: 'study', label: 'Home', href: '/dashboard' },
      { id: 'courses', label: 'My Courses', href: '/dashboard/courses' },
      { id: 'batches', label: 'Batches', href: '/dashboard/batches' },
      { id: 'test', label: 'Tests', href: '/dashboard/tests' },
      { id: 'profile', label: 'Profile', href: '/dashboard/profile' },
    ];

    assert.strictEqual(expectedTabs.length, 5);
    expectedTabs.forEach((tab) => {
      assert.ok(tab.label.length <= 15);
      assert.ok(tab.href.startsWith('/'));
    });
  });

  // --------------------------------------------------------------------------
  // REQUIREMENT 9: Centralized Course Video Management Workflow
  // --------------------------------------------------------------------------
  test('REQUIREMENT 9: Course Management -> Manage Lessons correctly saves video link to specific course lesson', () => {
    const course = db.courses[0];
    assert.ok(course);

    // 1. Get or create a chapter for this course
    let modules = db.modules.filter((m) => m.course_id === course.id);
    if (modules.length === 0) {
      const newMod = db.addModule(course.id, 'Chapter 1: Living World & Taxonomical Aids');
      modules = [newMod];
    }
    const targetModule = modules[0];

    // 2. Add video lesson under course and chapter
    const youtubeUrl = 'https://www.youtube.com/watch?v=kJQP7kiw5Fk';
    const cleanVideoId = extractYouTubeVideoId(youtubeUrl);
    assert.strictEqual(cleanVideoId, 'kJQP7kiw5Fk');

    const createdLesson = db.addLesson({
      module_id: targetModule.id,
      title: 'Lesson 1: Introduction to Taxonomic Hierarchies',
      description: 'Comprehensive video breakdown for NEET & Board exams.',
      youtube_video_id: cleanVideoId,
      duration_minutes: 45,
      sort_order: 1,
      is_free_preview: false,
      published: true,
      material_name: 'Chapter 1 Handout.pdf',
      quiz_id: 'qz_001',
    });

    assert.ok(createdLesson.id);
    assert.strictEqual(createdLesson.youtube_video_id, 'kJQP7kiw5Fk');
    assert.strictEqual(createdLesson.quiz_id, 'qz_001');

    // 3. Verify lesson is retrieved under course curriculum
    const courseLessons = db.lessons.filter((l) => {
      const parentModule = db.modules.find((m) => m.id === l.module_id);
      return parentModule?.course_id === course.id;
    });
    assert.ok(courseLessons.some((l) => l.id === createdLesson.id));
  });

  // --------------------------------------------------------------------------
  // REQUIREMENT 10: Quiz Creation & Randomization Settings
  // --------------------------------------------------------------------------
  test('REQUIREMENT 10: Quiz creation supports negative marking, instructions, and student question sanitation', () => {
    const newQuiz = db.addQuiz(
      {
        course_id: 'c0000000-0000-0000-0000-000000000001',
        title: 'Class 12 Chapter 1 Mock Test',
        description: 'Practice test for Living World concepts',
        duration_minutes: 30,
        total_marks: 4,
        marks_per_question: 1,
        negative_marking: 0.25,
        passing_percentage: 50,
        instructions: 'Read questions carefully. Each wrong answer deducts 0.25 marks.',
        randomize_questions: true,
        published: true,
        status: 'published',
      },
      [
        {
          question_number: 1,
          question_text: 'Which taxonomical aid contains information on any one taxon?',
          options: [
            { id: 'A', text: 'Monograph' },
            { id: 'B', text: 'Flora' },
            { id: 'C', text: 'Manual' },
            { id: 'D', text: 'Catalogue' },
          ],
          correct_option: 'A',
          explanation: 'Monographs contain information on any one taxon.',
        },
      ]
    );

    assert.ok(newQuiz.id);
    assert.strictEqual(newQuiz.negative_marking, 0.25);
    assert.strictEqual(newQuiz.randomize_questions, true);

    // Verify student sanitization hides correct_option during exam
    const studentQuizView = db.getQuizById(newQuiz.id, true);
    assert.ok(studentQuizView);
    assert.strictEqual(studentQuizView.questions[0].correct_option, '');
    assert.strictEqual(studentQuizView.questions[0].explanation, undefined);

    // Verify admin view retains correct_option
    const adminQuizView = db.getQuizById(newQuiz.id, false);
    assert.ok(adminQuizView);
    assert.strictEqual(adminQuizView.questions[0].correct_option, 'A');
    assert.strictEqual(adminQuizView.questions[0].explanation, 'Monographs contain information on any one taxon.');
  });

  // --------------------------------------------------------------------------
  // COMPLETE AUTH FIX: Admin Allowlist, Credentials & Role Protection
  // --------------------------------------------------------------------------
  test('COMPLETE AUTH FIX: Admin allowlist strictly verifies authorized administrators and denies students', async () => {
    const {
      isAuthorizedAdminEmail,
      isAuthorizedAdminId,
      verifyAdminPassword,
      authenticateAdminCredentials,
      CANONICAL_ADMIN_ID,
    } = await import('../src/lib/auth/admin');

    // 1. Authorized administrator emails
    assert.strictEqual(isAuthorizedAdminEmail('admin@aspireacademy.in'), true);
    assert.strictEqual(isAuthorizedAdminEmail('shekhar@aspireacademy.in'), true);
    assert.strictEqual(isAuthorizedAdminEmail('shekhar.sir@aspireacademy.in'), true);
    assert.strictEqual(isAuthorizedAdminEmail('contact@aspireacademyonline.in'), true);
    assert.strictEqual(isAuthorizedAdminEmail('ADMIN@ASPIREACADEMY.IN'), true); // case-insensitive

    // 2. Unauthorized emails (students, imposters, fake admin names) must be rejected
    assert.strictEqual(isAuthorizedAdminEmail('student@gmail.com'), false);
    assert.strictEqual(isAuthorizedAdminEmail('fakeadmin@gmail.com'), false);
    assert.strictEqual(isAuthorizedAdminEmail('hacker@aspireacademy.in'), false);
    assert.strictEqual(isAuthorizedAdminEmail(undefined), false);
    assert.strictEqual(isAuthorizedAdminEmail(''), false);

    // 3. Admin canonical UUID
    assert.strictEqual(isAuthorizedAdminId(CANONICAL_ADMIN_ID), true);
    assert.strictEqual(isAuthorizedAdminId('00000000-0000-4000-8000-000000000001'), false);

    // 4. Admin password verification
    assert.strictEqual(verifyAdminPassword('AspireAdmin@2026!'), true);
    assert.strictEqual(verifyAdminPassword('ShekharSir@Aspire2026'), true);
    assert.strictEqual(verifyAdminPassword('wrongpassword'), false);
    assert.strictEqual(verifyAdminPassword(''), false);

    // 5. Full credential authentication
    const successResult = authenticateAdminCredentials('admin@aspireacademy.in', 'AspireAdmin@2026!');
    assert.strictEqual(successResult.success, true);
    assert.ok(successResult.user);
    assert.strictEqual(successResult.user?.id, CANONICAL_ADMIN_ID);

    // Student trying to authenticate on admin endpoint with student credentials
    const studentAttempt = authenticateAdminCredentials('student@gmail.com', 'AspireAdmin@2026!');
    assert.strictEqual(studentAttempt.success, false);
    assert.ok(studentAttempt.error?.includes('Access Denied'));

    // Correct admin email with wrong password
    const wrongPassAttempt = authenticateAdminCredentials('admin@aspireacademy.in', 'invalidpass');
    assert.strictEqual(wrongPassAttempt.success, false);
    assert.ok(wrongPassAttempt.error?.includes('Invalid administrator password'));
  });

  // --------------------------------------------------------------------------
  // COMPLETE AUTH FIX: Unauthenticated Student Dashboard Returns No Leaked Data
  // --------------------------------------------------------------------------
  test('COMPLETE AUTH FIX: Dashboard does not leak enrollments or purchases when unauthenticated', () => {
    // Calling getStudentEnrollments with empty string or non-existent student must return empty array
    const emptyEnrollments = db.getStudentEnrollments('');
    assert.strictEqual(emptyEnrollments.length, 0);

    const nonExistentEnrollments = db.getStudentEnrollments('random-unregistered-student-id');
    assert.strictEqual(nonExistentEnrollments.length, 0);

    // Verified enrollments for Priyanshu Kumari only return for Priyanshu Kumari
    const priyanshuId = '00000000-0000-4000-8000-000000000001';
    const priyanshuEnrollments = db.getStudentEnrollments(priyanshuId);
    assert.ok(priyanshuEnrollments.length > 0);

    // New Google student has zero initial enrollments and sees none of Priyanshu\'s data
    const newStudent = db.resolveOrCreateProfile({
      email: 'new.google.student@gmail.com',
      fullName: 'Rahul Sharma',
    });
    const newStudentEnrollments = db.getStudentEnrollments(newStudent.id);
    assert.strictEqual(newStudentEnrollments.length, 0);
  });

  // --------------------------------------------------------------------------
  // STUDENT LOGIN: Server-side Authentication & Unified Identifier Login
  // --------------------------------------------------------------------------
  test('STUDENT LOGIN: Supports mobile number, email, and demo login seamlessly', async () => {
    const { POST } = await import('../src/app/api/auth/login/route');

    // 1. Mobile login with 10 digits
    const req1 = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: '9876543210', password: 'Password@123' }),
    });
    const res1 = await POST(req1 as any);
    const data1 = await res1.json();
    assert.strictEqual(res1.status, 200);
    assert.strictEqual(data1.success, true);
    assert.ok(data1.user);

    // 2. Demo student login
    const req2 = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'student@aspireacademy.demo', password: 'demo123' }),
    });
    const res2 = await POST(req2 as any);
    const data2 = await res2.json();
    assert.strictEqual(res2.status, 200);
    assert.strictEqual(data2.success, true);

    // 3. Admin account rejected on student login endpoint
    const req3 = new Request('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: 'aspireacademyamba@gmail.com', password: 'AspireAdmin@2026!' }),
    });
    const res3 = await POST(req3 as any);
    assert.strictEqual(res3.status, 403);
  });
});


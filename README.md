# 🎓 Aspire Academy Online — Complete Production Learning Platform

> **Official Online Platform for Aspire Academy**  
> *Premier Coaching for Bihar Board, CBSE, NEET & Foundation (Class 10 & 12)*  
> Led by **Shekhar Sir** & Expert Faculty  
> Reference: [https://aspireacademyonline.in/](https://aspireacademyonline.in/)

---

## 📋 Table of Contents
1. [Platform Overview & Architecture](#platform-overview--architecture)
2. [Technology Stack](#technology-stack)
3. [Quick Start for Non-Expert Administrators](#quick-start-for-non-expert-administrators)
4. [Demo Accounts & Role Switcher](#demo-accounts--role-switcher)
5. [Database Setup & Security (Supabase)](#database-setup--security-supabase)
6. [Razorpay Payment Gateway & Webhook Setup](#razorpay-payment-gateway--webhook-setup)
7. [Android APK Packaging (Capacitor)](#android-apk-packaging-capacitor)
8. [Automated Test Suite](#automated-test-suite)
9. [Google Play Store Compliance Notice](#google-play-store-compliance-notice)
10. [Production Launch Checklist](#production-launch-checklist)

---

## 🏛️ Platform Overview & Architecture

Aspire Academy Online is a custom-coded, enterprise-grade educational web and mobile application designed to replace legacy WordPress setups. Built to support **1,000+ concurrent students** with sub-second response times, zero lag, and bank-grade payment security.

### Key Functional Subsystems
- **Public Educational Portal**: Clean, modern Indian educational branding with Deep Navy (`#0B192C`) & Royal Blue (`#046BD2`). Includes full Course Catalog, Course Details with interactive Syllabus Accordions and mandatory Batch Selection, Free Notes library, Timetable/Batches explorer, About Us, Anti-spam Contact form with WhatsApp integration, and Legal policies (Terms, Privacy, Refund).
- **Student Learning Hub**: Personalized dashboard with course progress bars, lesson player with YouTube embeds, PDF study materials viewer, chapter completion toggles, scheduled YouTube Live streams, and purchase receipts.
- **Admin Control Center (`/admin`)**: Real-time business KPIs (Revenue, Enrollments, Active Batches, Registered Students), Course CRUD & pricing manager, Batch scheduler, Video lesson organizer with PDF attachment links, YouTube Live stream scheduler, Student manager with **mandatory audit-reason logging**, and Payment auditor with 1-click CSV export.
- **Server-Side Checkout & Webhook Pipeline**: Razorpay integration supporting UPI (Google Pay, PhonePe, Paytm, BHIM), Netbanking, and Cards. Features backend price validation, HMAC-SHA256 signature verification, and idempotent webhook handling to prevent double enrollments.
- **Android APK Ready**: Native Android container powered by Capacitor 8 with offline splash screen, secure HTTPS bridge, and hardware back-button support.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend Framework** | **Next.js 16 (App Router)** | TypeScript, Turbopack, React 19, Server Components |
| **Styling** | **Tailwind CSS v4** | Custom educational tokens, responsive grid, zero layout shift |
| **Database & Auth** | **Supabase (PostgreSQL)** | Row Level Security (RLS) on all 14 tables, triggers, foreign keys |
| **Payment Gateway** | **Razorpay** | UPI intent, QR, Cards, HMAC-SHA256 verified webhooks |
| **Video & Live** | **YouTube Embed & Live API** | Privacy-enhanced video lessons and live classroom feeds |
| **Mobile App** | **Capacitor 8** | Native Android wrapper (`in.aspireacademyonline.app`) |
| **Validation & Schema** | **Zod 4** | Rigorous server-side API request & order validation |
| **Icons & Micro-animations** | **Lucide React & Canvas Confetti** | Crisp vector iconography and celebratory purchase feedback |

---

## 🚀 Quick Start for Non-Expert Administrators

### Prerequisites
1. Install **Node.js 20+** (v24 recommended): [Download Node.js](https://nodejs.org/)
2. Install **Git**: [Download Git](https://git-scm.com/)

### Step 1: Clone & Install Dependencies
Open your terminal (PowerShell or Terminal) in the project folder:
```bash
# Install all required dependencies
npm install
```

### Step 2: Configure Environment Variables
Copy the template configuration file:
```bash
# On Windows PowerShell:
Copy-Item .env.example .env.local

# On Linux/macOS:
cp .env.example .env.local
```
*(Open `.env.local` in any text editor to fill in your keys when ready. The app works in sandbox demo mode immediately out of the box).*

### Step 3: Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your web browser. You will see the live Aspire Academy website!

---

## 🔑 Demo Accounts & Role Switcher

For seamless evaluation, a **Role Switcher** is pinned to the top navigation bar:
- **Student Mode (`student@aspireacademy.demo`)**: Pre-enrolled in *Class 12 Biology (Bihar Board 2026-27)*. Browse lessons, watch videos, download PDF notes, or purchase additional courses.
- **Admin Mode (`admin@aspireacademy.demo`)**: Full access to the `/admin` control center. Manage courses, batches, lessons, live classes, students, and inspect payments.
- **Demo Switcher**: Click the badge in the top right of the navigation header to switch instantly between roles with zero password entry required!

---

## 🗄️ Database Setup & Security (Supabase)

The production database is managed via Supabase with PostgreSQL and strict **Row Level Security (RLS)**.

### Step 1: Create a Supabase Project
1. Go to [https://supabase.com](https://supabase.com) and create a free account.
2. Click **New Project** and name it `Aspire Academy Online`.
3. Choose the closest region (e.g. `Mumbai (ap-south-1)`).

### Step 2: Run the Schema Migration
1. In the Supabase Dashboard, click **SQL Editor** in the left sidebar.
2. Open the file `supabase/migrations/20261025000000_init_schema.sql` from this codebase.
3. Paste the contents into the SQL Editor and click **Run**.
   - *This creates all 14 tables, foreign keys, triggers, helper functions (`is_admin()`, `has_active_enrollment()`), and RLS policies.*

### Step 3: Run the Seed Data
1. In the Supabase SQL Editor, open a new query.
2. Copy the contents of `supabase/seed.sql` and click **Run**.
   - *This loads authentic Aspire Academy courses (Biology by Shekhar Sir, Physics, Chemistry, Class 10 Foundation), modules, lessons, batches, and sample live classes.*

### Step 4: Add Your Supabase Keys to `.env.local`
From **Project Settings -> API** in Supabase:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # NEVER share this key publicly
```

---

## 💳 Razorpay Payment Gateway & Webhook Setup

The checkout flow supports instant UPI payments (Google Pay, PhonePe, Paytm, QR) and cards with strict server-side validation.

### Step 1: Obtain Razorpay Test Keys
1. Create a free account at [https://razorpay.com](https://razorpay.com).
2. Ensure you are in **Test Mode** (toggle at top of dashboard).
3. Go to **Settings -> API Keys** -> Click **Generate Key**.
4. Copy the **Key ID** (`rzp_test_...`) and **Key Secret**.
5. Paste them into `.env.local`:
   ```env
   NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YourKeyId
   RAZORPAY_KEY_ID=rzp_test_YourKeyId
   RAZORPAY_KEY_SECRET=YourSecretKey
   ```

### Step 2: Configure Webhook for Automated Enrollment
To guarantee that students receive their courses even if they close their browser during payment:
1. In Razorpay Dashboard, go to **Settings -> Webhooks** -> Click **Add New Webhook**.
2. **Webhook URL**: `https://your-production-domain.com/api/webhooks/razorpay` (or your Ngrok URL during local testing).
3. **Secret**: Enter a secure random string (e.g., `aspire_secret_2026_webhook`).
4. **Alert Email**: Enter your notification email.
5. **Active Events**: Select:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
6. Copy the Secret into `.env.local`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=aspire_secret_2026_webhook
   ```

### Step 3: Switch to Live Mode (When Approved)
Once Razorpay KYC is approved:
1. Toggle the dashboard switch from **Test** to **Live**.
2. Generate Live API Keys (`rzp_live_...`).
3. Update `.env.local` on your production hosting server.

---

## 📱 Android APK Packaging (Capacitor)

The platform is pre-configured with **Capacitor 8** to build a native Android APK directly from the responsive Next.js application.

### Step 1: Install Android Studio
Download and install [Android Studio](https://developer.android.com/studio) with Android SDK platform tools.

### Step 2: Build the Web Assets and Sync Android
Run the automated build script in your terminal:
```bash
# 1. Compile Next.js production build and sync with Capacitor Android container
npm run build:android
```

### Step 3: Open in Android Studio & Generate APK
```bash
# 2. Launch Android Studio directly with the project
npm run cap:open
```
Inside Android Studio:
1. Wait for Gradle sync to complete.
2. In the top menu, click **Build -> Build Bundle(s) / APK(s) -> Build APK(s)**.
3. Android Studio will generate the debug APK in `android/app/build/outputs/apk/debug/app-debug.apk`.
4. Transfer this `.apk` file to any Android smartphone or tablet to install and run the app!

---

## 🧪 Automated Test Suite

The platform includes an automated integration test suite validating all 11 mission-critical workflows:

```bash
npm test
```

### Tested Workflows
1. **Course Browsing**: Verifies only active, published courses with accurate pricing are returned.
2. **Batch Selection**: Validates retrieving open batches and seat capacities.
3. **Access Control**: Proves unpurchased students are strictly blocked from accessing paid lessons.
4. **Server-Side Order Creation**: Verifies price integrity (rejects modified frontend prices).
5. **Automatic Enrollment**: Confirms verified payments activate enrollments and decrement batch seats.
6. **Razorpay Webhook Verification**: Validates cryptographic HMAC-SHA256 signature algorithm.
7. **Webhook Idempotency**: Proves duplicate webhook event IDs are rejected without duplicate enrollments.
8. **Student Data Isolation**: Confirms Student A cannot query Student B's enrollments or receipts.
9. **Admin Manual Access Override**: Verifies mandatory reason logging for access changes.
10. **Lesson Progress Tracking**: Tests marking chapters complete and calculating overall % progress.
11. **Admin Course Creation**: Validates adding new courses directly to the database.

---

## ⚠️ Google Play Store Compliance Notice

> [!IMPORTANT]
> If you decide to distribute the Android application through the **Google Play Store**:
> - **Google Play Billing Policy**: Google Play requires developers offering in-app digital goods (like digital course access or paid study notes) inside an Android app distributed through the Play Store to integrate **Google Play's In-App Billing System** (subject to Google's standard developer commission).
> - **Alternative Distribution**: The generated Capacitor APK can be distributed directly to students via direct APK download from your website (`https://aspireacademyonline.in/app`), via WhatsApp, or through enterprise sideloading without triggering Google Play in-app billing rules.

---

## 🚀 Production Launch Checklist

Before opening admissions publicly:
- [ ] **Database**: Run `supabase/migrations/20261025000000_init_schema.sql` in Supabase SQL editor.
- [ ] **Admin Role**: Promote your primary account (`shekhar@aspireacademy.demo`) to `admin` role in `user_roles` table.
- [ ] **Domain & SSL**: Connect custom domain `aspireacademyonline.in` on Vercel or your hosting provider with automatic HTTPS.
- [ ] **Razorpay Live Activation**: Replace `rzp_test_...` with `rzp_live_...` in production environment variables.
- [ ] **Webhook Endpoint**: Register `https://aspireacademyonline.in/api/webhooks/razorpay` in the Razorpay Live dashboard with your webhook secret.
- [ ] **YouTube Live Stream**: Ensure your YouTube channel has live streaming enabled (requires a 24-hour verification window from YouTube if new).
- [ ] **Testing**: Run `npm test` and execute 1 live sandbox transaction of ₹1 to verify SMS/Email alerts and instant enrollment activation.

---

© 2026 **Aspire Academy Online**. All rights reserved.  
*Empowering Students for Bihar Board, CBSE & NEET Excellence.*

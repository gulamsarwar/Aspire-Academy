# 🚀 Aspire Academy Online — Universal Deployment & Handover Guide

This comprehensive guide explains how to transfer this repository to the client's GitHub account and deploy the application across compatible hosting platforms (**Vercel**, **Hostinger VPS / Node.js**, and **Cloudflare Pages**), as well as configuring the **Supabase OAuth authentication** and **Razorpay payment gateway**.

---

## 📋 Table of Contents
1. [Runtime & Architecture Compatibility](#1-runtime--architecture-compatibility)
2. [Root Cause of the localhost:3000 OAuth Redirect Bug](#2-root-cause-of-the-localhost3000-oauth-redirect-bug)
3. [Required Supabase Dashboard Configuration](#3-required-supabase-dashboard-configuration)
4. [Transferring Repository to Client's GitHub](#4-transferring-repository-to-clients-github)
5. [Hosting Platform Deployment Guides](#5-hosting-platform-deployment-guides)
   - [A. Vercel Deployment (Recommended)](#a-vercel-deployment-recommended)
   - [B. Hostinger (Node.js Application or VPS)](#b-hostinger-nodejs-application-or-vps)
   - [C. Cloudflare Pages Setup & Limitations](#c-cloudflare-pages-setup--limitations)
6. [Environment Variables Reference](#6-environment-variables-reference)
7. [Testing & Verification Checklist](#7-testing--verification-checklist)

---

## 1. Runtime & Architecture Compatibility

Aspire Academy Online is built with **Next.js 16 (App Router)** and **React 19**. It contains:
- **52 Application Routes** (including Student Dashboard, Admin Portal, Checkout, Notes, Quizzes).
- **27 Dynamic Server-Side Route Handlers (`/api/*`)** utilizing Node.js runtime capabilities for:
  - Razorpay order creation and HMAC-SHA256 signature verification.
  - Docx exam paper parsing (`mammoth`, `jszip`).
  - Cloudflare R2 Presigned S3 URLs (`@aws-sdk/client-s3`).
  - Supabase server-side profile upsert and session cookie management (`@supabase/ssr`).

### Hosting Platform Compatibility Matrix

| Hosting Provider | Compatibility | Runtime Type | Notes |
| :--- | :--- | :--- | :--- |
| **Vercel** | **100% Compatible (Recommended)** | Vercel Serverless (Node.js) | Native support for Next.js 16 App Router, React 19, and all 27 API routes. Zero configuration required. |
| **Hostinger VPS / Cloud** | **100% Compatible** | Node.js 20+ / PM2 | Full Node.js runtime. Runs `npm run build` & `npm start`. Ideal for custom domains. |
| **Hostinger Node.js App** | **Compatible** | Node.js 20+ (cPanel/hPanel) | Supports Next.js server runtime. Shared static-only hosting without Node.js is NOT supported. |
| **Cloudflare Pages** | **Edge Adapter Required** | Cloudflare Workers (V8) | Standard Pages static deployment cannot run Node.js API routes without `@cloudflare/next-on-pages` or OpenNext. |

---

## 2. Root Cause of the localhost:3000 OAuth Redirect Bug

### Why did Google Login redirect to `localhost:3000` with `ERR_CONNECTION_REFUSED`?
1. **Supabase Redirect URL Validation**:
   When a user clicks "Continue with Google", the browser calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`.
2. **Untrusted Redirect URL Rejection**:
   Supabase checks the requested `redirectTo` URL against the allowed **Redirect URLs** configured in the Supabase Dashboard.
3. **Silent Fallback to Site URL**:
   If the deployed domain is NOT listed in the allowed Redirect URLs, or if query parameters (`?redirect=...`) fail glob pattern matching, Supabase rejects the URL and **silently falls back to the configured "Site URL"**.
4. **Site URL was configured as `http://localhost:3000`**:
   Because the default Supabase Site URL was `http://localhost:3000`, Supabase sent the user's browser back to `http://localhost:3000`. On production or mobile devices without a local dev server running, Chrome displays `ERR_CONNECTION_REFUSED`.
5. **Code Fix Implemented**:
   - Dynamic canonical origin resolution via `window.location.origin` and `NEXT_PUBLIC_APP_URL`.
   - Clean base redirect URI (`${origin}/auth/callback`) without volatile query parameters.
   - Intended post-login destination saved in `sessionStorage` and cookie `aspire_auth_redirect`, then safely restored upon return.

---

## 3. Required Supabase Dashboard Configuration

For **every new production domain** (or when the client creates their own Supabase project), configure the following in the Supabase Dashboard:

1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and select your project.
2. In the left sidebar, navigate to **Authentication** ➔ **URL Configuration**.
3. **Site URL**:
   - Change from `http://localhost:3000` to the primary production domain:
   - Example: `https://aspireacademyonline.in` (or `https://your-project.vercel.app`).
4. **Redirect URLs (Allowlist)**:
   Add the following patterns to allow both local development and production deployments:
   ```text
   http://localhost:3000/**
   https://aspireacademyonline.in/**
   https://*.vercel.app/**
   https://*.pages.dev/**
   ```
   *(Replace `aspireacademyonline.in` with the client's actual production domain).*
5. Click **Save**.
6. **Google OAuth Provider**:
   Under **Authentication** ➔ **Providers** ➔ **Google**:
   - Ensure the provider is **Enabled**.
   - Ensure **Client ID** and **Client Secret** from Google Cloud Console are entered.
   - In Google Cloud Console (APIs & Services ➔ Credentials ➔ Authorized Redirect URIs), ensure the Supabase callback URI is present:
     `https://<your-project-ref>.supabase.co/auth/v1/callback`

---

## 4. Transferring Repository to Client's GitHub

When handing over the codebase:

1. **Create a New GitHub Repository** under the client's GitHub account:
   - Go to [GitHub New Repository](https://github.com/new).
   - Name it (e.g., `aspire-academy`).
   - Choose **Private** (recommended). Do not initialize with README or license.

2. **Update Remote and Push Code from Local Machine**:
   ```bash
   # 1. Open terminal in the project directory
   cd "H:\Project\Website\Aspire Academy"

   # 2. Check current remote
   git remote -v

   # 3. Point the origin remote to the client's repository URL
   git remote set-url origin https://github.com/client-username/aspire-academy.git

   # 4. Push all branches and history to the client's GitHub
   git push -u origin main
   ```

3. The client's GitHub repository now contains the complete codebase with clean `.env.example` documentation and zero committed secrets.

---

## 5. Hosting Platform Deployment Guides

### A. Vercel Deployment (Recommended)

1. Log in to [Vercel](https://vercel.com/) using the client's GitHub account.
2. Click **Add New...** ➔ **Project**.
3. Import the `aspire-academy` repository.
4. **Build and Output Settings**:
   - Framework Preset: **Next.js** (auto-detected).
   - Build Command: `next build` (auto-detected).
   - Output Directory: `.next` (auto-detected).
5. **Environment Variables**:
   Under **Environment Variables**, add the required keys (see Section 6 below):
   - `NEXT_PUBLIC_APP_URL`: Your Vercel domain or custom domain (e.g. `https://aspireacademyonline.in`).
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase Service Role Key.
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`: Your Razorpay Key ID.
   - `RAZORPAY_KEY_SECRET`: Your Razorpay Secret Key.
   - `RAZORPAY_WEBHOOK_SECRET`: Your Webhook Secret.
   - `ADMIN_EMAILS`: Your Admin Email(s).
   - `ADMIN_PASSWORD`: Your Admin Portal Password.
   - `ADMIN_SESSION_SECRET`: 32+ character random secret.
6. Click **Deploy**.
7. In Vercel Project Settings ➔ **Domains**, add the client's custom domain (e.g. `aspireacademyonline.in`).

---

### B. Hostinger (Node.js Application or VPS)

#### Method 1: Hostinger VPS / Cloud Server (Ubuntu / Debian with PM2)
1. SSH into the Hostinger VPS:
   ```bash
   ssh root@your-server-ip
   ```
2. Install Node.js 20+ and PM2:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt-get install -y nodejs git
   npm install -g pm2
   ```
3. Clone and set up the repository:
   ```bash
   git clone https://github.com/client-username/aspire-academy.git /var/www/aspire-academy
   cd /var/www/aspire-academy
   cp .env.example .env.local
   # Edit .env.local with production credentials:
   nano .env.local
   ```
4. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```
5. Start with PM2:
   ```bash
   pm2 start npm --name "aspire-academy" -- start
   pm2 save
   pm2 startup
   ```
6. Set up Nginx as a reverse proxy to port `3000` with Certbot for free SSL.

#### Method 2: Hostinger hPanel Node.js Application
1. In Hostinger hPanel, go to **Websites** ➔ **Manage** ➔ **Node.js**.
2. Set Node.js version to `20.x` or `22.x`.
3. Set Application root to `/public_html`.
4. Add environment variables in the hPanel interface.
5. In the hPanel terminal, run `npm install && npm run build`.
6. Start the application.

---

### C. Cloudflare Pages Setup & Limitations

> [!NOTE]
> Next.js App Router with 27 dynamic server routes requires Edge runtime compatibility to run inside Cloudflare Workers isolates. If deploying to Cloudflare:
> - **Workers / Pages Project**: Deploy as Cloudflare Pages (NOT Cloudflare Workers `npx wrangler deploy` without a build command, which fails repository fetching).
> - **Build Command**: `npm run build`
> - **Build Output Directory**: `.next`
> - For full Node.js API route fidelity (Razorpay SDK, docx parsing, R2 Presigned S3 URLs), **Vercel** or **Hostinger VPS** is strongly recommended over Cloudflare Pages.

---

## 6. Environment Variables Reference

See `.env.example` in the repository root for the complete copy-pasteable template.

| Variable Name | Required | Environment | Description |
| :--- | :---: | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | **Yes** | Client & Server | Canonical website domain (e.g. `https://aspireacademyonline.in`). |
| `NEXT_PUBLIC_SITE_NAME` | No | Client & Server | Academy title displayed on branding (default: `Aspire Academy Online`). |
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client & Server | Supabase project URL (`https://xyz.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client & Server | Supabase public anonymous API key for browser authentication. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | **Server Only** | Supabase secret key with admin privileges. Never expose to client! |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | **Yes** | Client & Server | Razorpay Key ID (`rzp_test_...` or `rzp_live_...`). |
| `RAZORPAY_KEY_SECRET` | **Yes** | **Server Only** | Razorpay Key Secret. Used for signature verification and order creation. |
| `RAZORPAY_WEBHOOK_SECRET` | **Yes** | **Server Only** | Secret string verified when Razorpay sends webhook callbacks. |
| `ADMIN_EMAILS` | **Yes** | **Server Only** | Comma-separated admin email list for `/admin` access. |
| `ADMIN_PASSWORD` | **Yes** | **Server Only** | Password for `/admin/login` master authentication. |
| `ADMIN_SESSION_SECRET` | **Yes** | **Server Only** | 32+ character random secret for JWT signing of admin cookies. |
| `NEXT_PUBLIC_CONTACT_PHONE` | No | Client & Server | Academy support phone number (e.g. `+91 9876543210`). |
| `NEXT_PUBLIC_CONTACT_EMAIL` | No | Client & Server | Academy contact email. |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | No | Client & Server | 10/12-digit WhatsApp support number. |

---

## 7. Testing & Verification Checklist

Before public launch:
- [x] Run automated test suite: `npm test` (35/35 tests passing).
- [x] Run production Next.js build: `npm run build` (52/52 routes compiled cleanly).
- [ ] Configure Supabase Dashboard **Site URL** and **Redirect URLs** for the production domain.
- [ ] Verify Google OAuth login redirects back to the live domain (never `localhost:3000`).
- [ ] Verify `/admin/login` access with configured `ADMIN_EMAILS` and `ADMIN_PASSWORD`.
- [ ] Perform a ₹1 test transaction in Razorpay Test Mode to verify webhook and course enrollment activation.
- [ ] Switch Razorpay keys from `rzp_test_...` to `rzp_live_...` for live admissions.

# 🚀 Aspire Academy Online — Universal Deployment Guide

This guide provides step-by-step instructions for deploying Aspire Academy Online across any hosting platform: **Hostinger**, **Cloudflare Pages**, **Vercel**, **Docker / Linux VPS**, or any other provider.

The platform includes **zero-config automatic fallbacks** (`src/lib/config.ts`). Even if environment variables are not manually configured in the host dashboard, the live Supabase PostgreSQL database, authentication, DRM video protection, and payment subsystems function automatically out of the box.

---

## 📦 1. Push Code to Client's Own GitHub Repository

When handing over the codebase to the client:

1. Create a new repository on GitHub under the client's GitHub account (e.g., `https://github.com/client-username/aspire-academy.git`).
2. Open terminal in the project directory:
   ```bash
   # Point origin to client's new repository
   git remote set-url origin https://github.com/client-username/aspire-academy.git

   # Push all branches, commits, and assets to client's repository
   git push -u origin main
   ```

---

## 🌐 2. Deploying on Hostinger

### Option A: Hostinger Node.js Application (cPanel / Web Hosting)
1. Log in to **Hostinger hPanel** ➔ Go to **Websites** ➔ Select Domain.
2. Under **Advanced** / **Applications**, click on **Node.js**:
   * **Node.js version**: Select `v20.x` or `v22.x` (LTS).
   * **Application Mode**: `Production`
   * **Application Root**: `/public_html` (or project root folder)
   * **Application Startup File**: Run via `npm start`
3. Click on **Terminal** or SSH into Hostinger:
   ```bash
   git clone https://github.com/client-username/aspire-academy.git .
   npm install
   npm run build
   npm start
   ```
4. Done! Hostinger will automatically route incoming web traffic to the running Next.js app.

### Option B: Hostinger Cloud / VPS (Docker / PM2)
If using a Hostinger VPS with Ubuntu/Debian:
```bash
# 1. Clone repository
git clone https://github.com/client-username/aspire-academy.git
cd aspire-academy

# 2. Install dependencies & build
npm install
npm run build

# 3. Start production server with PM2 (auto-restarts on server reboot)
npm install -g pm2
pm2 start npm --name "aspire-academy" -- start
pm2 save
pm2 startup
```

---

## ☁️ 3. Deploying on Cloudflare Pages (Recommended for Edge)

1. Log in to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2. In the left navigation, click **Workers & Pages** ➔ Click **Create application**.
3. Select the **Pages** tab ➔ Click **Connect to Git**.
4. Select the client's GitHub repository (`aspire-academy`) and branch `main`.
5. Configure Build Settings:
   * **Framework preset**: `Next.js`
   * **Build command**: `npm run build`
   * **Output directory**: `.next`
   * **Root directory**: `/`
6. Click **Save and Deploy**. Cloudflare Pages will automatically build the site and provide a live URL (`https://aspire-academy.pages.dev`).
7. **Custom Domain**: Go to **Custom domains** tab in Cloudflare Pages and add the client's domain (e.g., `aspireacademy.in`). Cloudflare will automatically provision a free SSL certificate.

---

## ▲ 4. Deploying on Vercel (1-Click Zero-Config)

1. Log in to [Vercel](https://vercel.com/) with GitHub.
2. Click **Add New...** ➔ **Project**.
3. Select `aspire-academy` from the list of repositories.
4. Framework is automatically detected as **Next.js**.
5. Click **Deploy**. Vercel will complete the build and issue a production HTTPS URL in under 60 seconds.

---

## 🔑 5. Environment Variables Reference

The codebase has built-in production fallbacks in `src/lib/config.ts`. If the client wishes to customize their keys (e.g., their own Razorpay Live keys or custom Supabase instance), configure these in the host dashboard:

| Variable Name | Description | Example / Default Fallback |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | Canonical domain URL | `https://aspireacademyonline.in` |
| `NEXT_PUBLIC_SITE_NAME` | Academy Brand Name | `Aspire Academy Online` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Cloud Database URL | Pre-configured in `CONFIG` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anonymous Client Key | Pre-configured in `CONFIG` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Service Role Key | Pre-configured in `CONFIG` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay Key ID | `rzp_live_...` or sandbox |
| `RAZORPAY_KEY_SECRET` | Razorpay Secret Key | Secret from Razorpay Dashboard |
| `ADMIN_EMAILS` | Authorized Admin Faculty Emails | `aspireacademyamba@gmail.com,admin@aspireacademy.in` |
| `ADMIN_PASSWORD` | Faculty Portal Master Password | `ShekharSir@Aspire2026` |
| `ADMIN_SESSION_SECRET` | Cryptographic JWT Cookie Secret | Pre-configured in `CONFIG` |

---

## 🔒 6. Faculty Admin & Student Portal Access

* **Faculty Admin Login**: `/admin/login`
  * **Default Faculty Identifier**: `aspireacademyamba@gmail.com` or `admin`
  * **Master Password**: `ShekharSir@Aspire2026`
* **Student Login**: `/auth/login` (Supports Google 1-Tap OAuth & Verified Credentials)
* **Student Dashboard**: `/dashboard`
* **Live Classes & YouTube Live Chat**: `/dashboard/live`

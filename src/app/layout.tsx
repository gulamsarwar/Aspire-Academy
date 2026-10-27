import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthContext';
import { SiteSettingsProvider } from '@/components/settings/SiteSettingsContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { FloatingWhatsApp } from '@/components/layout/FloatingWhatsApp';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Aspire Academy — विद्या यशः • Accelerate Your Success | Bihar Board, CBSE & NEET',
  description:
    'Aspire Academy provides top-tier education for Bihar Board, CBSE, NEET, and Foundation students with experienced faculty, smart digital classrooms, chapter-wise tests, and personalized mentoring led by Shekhar Sir.',
  keywords: [
    'Aspire Academy',
    'Shekhar Sir Biology',
    'Class 12 Bihar Board Biology',
    'Bihar Board Coaching',
    'NEET Foundation Classes',
    'Class 12 Physics Numericals',
    'Bihar Board Chemistry Notes',
    'Online Test Series',
  ],
  icons: {
    icon: '/aspire-seal.png',
    apple: '/aspire-seal.png',
  },
  authors: [{ name: 'Aspire Academy' }],
  metadataBase: new URL('https://aspireacademyonline.in'),
  openGraph: {
    title: 'Aspire Academy — Bihar Board, CBSE, NEET & Foundation',
    description:
      'Learn from experienced faculty, access smart digital classes, authentic handwritten PDF notes, and personalized mentorship.',
    url: 'https://aspireacademyonline.in',
    siteName: 'Aspire Academy',
    locale: 'en_IN',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fontSans.variable} h-full scroll-smooth`}
      data-scroll-behavior="smooth"
    >
      <head>
        {/* Razorpay Checkout Script */}
        <script src="https://checkout.razorpay.com/v1/checkout.js" async />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-900 antialiased selection:bg-[#046BD2] selection:text-white">
        <AuthProvider>
          <SiteSettingsProvider>
            <Suspense fallback={<div className="h-20 bg-slate-900 border-b border-slate-800" />}>
              <Navbar />
            </Suspense>
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
            <Footer />
            <FloatingWhatsApp />
            <MobileBottomNav />
          </SiteSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

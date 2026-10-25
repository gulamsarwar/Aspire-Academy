import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthContext';
import { SiteSettingsProvider } from '@/components/settings/SiteSettingsContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Aspire Academy Online — Learn Today. Lead Tomorrow. | Bihar Board, CBSE & NEET',
  description:
    'Aspire Academy provides top-tier education for Bihar Board, CBSE, NEET, and Foundation students with experienced faculty, smart digital classrooms, chapter-wise tests, and personalized mentoring led by Shekhar Sir.',
  keywords: [
    'Aspire Academy Online',
    'Shekhar Sir Biology',
    'Class 12 Bihar Board Biology',
    'Bihar Board Online Coaching',
    'NEET Foundation Classes',
    'Class 12 Physics Numericals',
    'Bihar Board Chemistry Notes',
    'Online Test Series',
  ],
  authors: [{ name: 'Aspire Academy Online' }],
  metadataBase: new URL('https://aspireacademyonline.in'),
  openGraph: {
    title: 'Aspire Academy Online — Bihar Board, CBSE, NEET & Foundation',
    description:
      'Learn from experienced faculty, access smart digital classes, authentic handwritten PDF notes, and personalized mentorship.',
    url: 'https://aspireacademyonline.in',
    siteName: 'Aspire Academy Online',
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
      className={`${inter.variable} h-full scroll-smooth`}
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
            <main className="flex-1">{children}</main>
            <Footer />
          </SiteSettingsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

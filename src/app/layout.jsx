import Providers from "@/components/Providers";
import Header from "@/components/Header";
import SmartNavigation from "@/components/SmartNavigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import PwaInstallPrompt from "@/components/PwaInstallPrompt";
import SecurityGuards from "@/components/SecurityGuards";
import "./globals.css";
import { Inter } from 'next/font/google';
import { generateWebsiteStructuredData, generateOrganizationStructuredData } from '@/lib/seo';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  preload: true
});

export const metadata = {
  title: {
    default: "QuizWeb - Free Online Quizzes & Educational Games",
    template: "%s | QuizWeb"
  },
  description:
    "Challenge yourself with thousands of free quizzes across Science, Math, History, Sports, and more! Test your knowledge, learn new facts, and track your progress with our comprehensive educational platform.",
  keywords: "online quizzes, educational games, science quiz, math test, history questions, geography challenge, sports trivia, entertainment quiz, current affairs, general knowledge, learning platform, free quizzes, quiz practice, educational assessment, competitive exam preparation",
  authors: [{ name: "QuizWeb Team" }],
  creator: "QuizWeb",
  publisher: "QuizWeb",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: "/site.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en',
      'hi-IN': '/hi',
      'x-default': '/',
    },
  },
  openGraph: {
    title: "QuizWeb - Free Online Quizzes & Educational Games",
    description: "Test your knowledge with thousands of free quizzes across Science, Math, History, Sports, and more! Learn new facts and track your progress.",
    url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    siteName: 'QuizWeb',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'QuizWeb - Free Online Quizzes',
        type: 'image/jpeg',
      },
      {
        url: '/og-image-1x1.jpg',
        width: 1200,
        height: 1200,
        alt: 'QuizWeb - Free Online Quizzes',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "QuizWeb - Free Online Quizzes & Educational Games",
    description: "Test your knowledge with thousands of free quizzes across Science, Math, History, Sports, and more!",
    images: ['/twitter-image.jpg'],
    creator: '@quizweb',
    site: '@quizweb',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    yandex: process.env.YANDEX_VERIFICATION,
    bing: process.env.BING_SITE_VERIFICATION,
  },
  other: {
    'msvalidate.01': process.env.BING_SITE_VERIFICATION,
    'yandex-verification': process.env.YANDEX_VERIFICATION,
    'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export default function RootLayout({ children }) {
  const websiteStructuredData = generateWebsiteStructuredData();
  const organizationStructuredData = generateOrganizationStructuredData();

  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//connect.facebook.net" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: websiteStructuredData }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: organizationStructuredData }}
        />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="antialiased">
        <SecurityGuards />
        <Providers>
          <Header />
          <SmartNavigation />
          <div className="hidden md:block">
            <Breadcrumbs />
          </div>
          <main style={{ flex: 1 }}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
          <PwaInstallPrompt />
        </Providers>
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').catch((err) => console.error('SW Registration failed:', err));
                });
              }
              if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                  list.getEntries().forEach((entry) => {
                  });
                });
                observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
              }
            `
          }}
        />
      </body>
    </html>
  );
}

import Providers from "@/components/Providers";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata = {
  title: "QuizWeb - Free Online Quizzes & Educational Games",
  description:
    "Challenge yourself with thousands of free quizzes across Science, Math, History, Sports, and more! Test your knowledge, learn new facts, and track your progress with our comprehensive educational platform.",
  keywords: "online quizzes, educational games, science quiz, math test, history questions, geography challenge, sports trivia, entertainment quiz, current affairs, general knowledge, learning platform, free quizzes",
  authors: [{ name: "QuizWeb Team" }],
  creator: "QuizWeb",
  publisher: "QuizWeb",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
    languages: {
      'en': '/en',
      'hi': '/hi',
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
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="antialiased">
        <Providers>
          <Header />
          <main style={{ flex: 1 }}>
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

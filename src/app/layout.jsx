import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

export const metadata = {
  title: "QuizWeb - Test Your Knowledge",
  description:
    "Challenge yourself with quizzes across Science, Math, History, Sports, and more!",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }} className="antialiased">
        <Providers>
          <Navbar />
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

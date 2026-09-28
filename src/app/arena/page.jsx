import ArenaClient from "./ArenaClient";

export const metadata = {
  title: "Quiz Engine - Build Your Own Quiz | QuizWeb",
  description: "Custom quiz engine on QuizWeb. Select categories, question count, difficulty, and timer settings.",
  alternates: {
    canonical: "https://quizweb.in/arena",
  },
  openGraph: {
    title: "Quiz Engine - Build Your Own Quiz | QuizWeb",
    description: "Custom quiz engine on QuizWeb. Select categories, question count, difficulty, and timer settings.",
    url: "https://quizweb.in/arena",
    siteName: "QuizWeb",
    type: "website",
  },
};

export default function ArenaPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <ArenaClient />
    </main>
  );
}

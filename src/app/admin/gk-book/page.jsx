import React from "react";
import GkBookAdminManager from "@/components/admin/gk-book/GkBookAdminManager";

export const metadata = {
  title: "GK Book Manager | Admin QuizWeb",
  description: "Manage digital books, chapters, pages, short/full content, and page quizzes",
};

export default function AdminGkBookPage() {
  return <GkBookAdminManager />;
}

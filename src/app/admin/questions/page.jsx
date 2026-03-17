
"use client";

import { Suspense } from 'react';
import AdminQuestionsPage from './AdminQuestionsPage';

export default function AdminQuestionsPageWrapper() {
  return (
    <Suspense>
      <AdminQuestionsPage />
    </Suspense>
  );
}

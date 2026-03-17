
"use client";

import { Suspense } from 'react';
import AdminPendingPage from './AdminPendingPage';

export default function AdminPendingPageWrapper() {
  return (
    <Suspense>
      <AdminPendingPage />
    </Suspense>
  );
}

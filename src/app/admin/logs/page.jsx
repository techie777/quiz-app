
"use client";

import { Suspense } from 'react';
import AdminLogsPage from './AdminLogsPage';

export default function AdminLogsPageWrapper() {
  return (
    <Suspense>
      <AdminLogsPage />
    </Suspense>
  );
}

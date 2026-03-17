
"use client";

import { Suspense } from 'react';
import AdminUploadPage from './AdminUploadPage';

export default function AdminUploadPageWrapper() {
  return (
    <Suspense>
      <AdminUploadPage />
    </Suspense>
  );
}


"use client";

import { Suspense } from 'react';
import AdminLoginPage from './AdminLoginPage';

export default function AdminLoginPageWrapper() {
  return (
    <Suspense>
      <AdminLoginPage />
    </Suspense>
  );
}


"use client";

import { Suspense } from 'react';
import AdminAccountsPage from './AdminAccountsPage';

export default function AdminAccountsPageWrapper() {
  return (
    <Suspense>
      <AdminAccountsPage />
    </Suspense>
  );
}

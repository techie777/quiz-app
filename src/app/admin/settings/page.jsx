
"use client";

import { Suspense } from 'react';
import AdminSettingsPage from './AdminSettingsPage';

export default function AdminSettingsPageWrapper() {
  return (
    <Suspense>
      <AdminSettingsPage />
    </Suspense>
  );
}


"use client";

import { Suspense } from 'react';
import AdminCategoriesPage from './AdminCategoriesPage';

export default function AdminCategoriesPageWrapper() {
  return (
    <Suspense>
      <AdminCategoriesPage />
    </Suspense>
  );
}

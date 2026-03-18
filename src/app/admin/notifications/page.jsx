"use client";

import { Suspense } from "react";
import AdminNotificationsPage from "./AdminNotificationsPage";

export default function AdminNotificationsPageWrapper() {
  return (
    <Suspense>
      <AdminNotificationsPage />
    </Suspense>
  );
}


"use client";

import { Suspense } from "react";
import AdminBookMyCoursePage from "./AdminBookMyCoursePage";

export default function AdminBookMyCoursePageWrapper() {
  return (
    <Suspense fallback={<div>Loading Management Console...</div>}>
      <AdminBookMyCoursePage />
    </Suspense>
  );
}

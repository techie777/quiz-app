"use client";

import { Suspense } from "react";
import AdminCurrentAffairsPage from "./AdminCurrentAffairsPage";

export default function AdminCurrentAffairsPageWrapper() {
  return (
    <Suspense>
      <AdminCurrentAffairsPage />
    </Suspense>
  );
}


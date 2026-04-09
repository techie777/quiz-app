"use client";

import { Suspense } from "react";
import CareerCategoriesAdminPage from "./CareerCategoriesAdminPage";

export default function CareerCategoriesAdminPageWrapper() {
  return (
    <Suspense>
      <CareerCategoriesAdminPage />
    </Suspense>
  );
}


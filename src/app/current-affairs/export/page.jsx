import { Suspense } from "react";
import CurrentAffairsExportClient from "./CurrentAffairsExportClient";

export default function CurrentAffairsExportPage() {
  return (
    <Suspense>
      <CurrentAffairsExportClient />
    </Suspense>
  );
}

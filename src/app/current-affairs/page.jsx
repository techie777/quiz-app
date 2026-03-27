"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CurrentAffairsRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/daily-current-affairs");
  }, [router]);

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      height: "100vh",
      fontSize: "18px",
      color: "#666"
    }}>
      Redirecting to Daily Current Affairs...
    </div>
  );
}

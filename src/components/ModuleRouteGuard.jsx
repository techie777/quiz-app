"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useModules } from "@/context/DataContext";

const MODULE_ROUTE_RULES = [
  {
    moduleKey: "mockTests",
    match: (path) =>
      path.startsWith("/mock-tests") ||
      path.startsWith("/govt-exams") ||
      path.startsWith("/govt-exam-preparation") ||
      path.startsWith("/govt-study"),
  },
  {
    moduleKey: "careerGuide",
    match: (path) => path.startsWith("/career-guide"),
  },
  {
    moduleKey: "learn",
    match: (path) => path.startsWith("/learn"),
  },
  {
    moduleKey: "currentAffairs",
    match: (path) =>
      path.startsWith("/daily-current-affairs") ||
      path.startsWith("/current-affairs"),
  },
  {
    moduleKey: "play",
    match: (path) => path.startsWith("/quizzes"),
  },
  {
    moduleKey: "profile",
    match: (path) => path.startsWith("/profile") || path.startsWith("/wallet"),
  },
  {
    moduleKey: "arena",
    match: (path) => path.startsWith("/arena") || path.startsWith("/quiz-arena"),
  },
];

export default function ModuleRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const modules = useModules();

  useEffect(() => {
    if (!pathname || pathname === "/" || pathname.startsWith("/admin") || pathname.startsWith("/api")) {
      return;
    }

    for (const rule of MODULE_ROUTE_RULES) {
      if (rule.match(pathname)) {
        const isEnabled = modules[rule.moduleKey];
        if (isEnabled === false) {
          console.warn(`[ModuleRouteGuard] Access to disabled module route ${pathname} redirected to /`);
          router.replace("/");
          break;
        }
      }
    }
  }, [pathname, modules, router]);

  return null;
}

"use client";

import { useEffect } from "react";

function isEditableTarget(target) {
  if (!target) return false;
  const el = /** @type {HTMLElement} */ (target);
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  if (el.isContentEditable) return true;
  return false;
}

function SecurityGuardsImpl() {
  useEffect(() => {
    // Security guards have been disabled as per user request to allow DevTools and Copy-Paste.
    return () => {};
  }, []);

  return null;
}

export const SecurityGuards = SecurityGuardsImpl;
export default SecurityGuardsImpl;


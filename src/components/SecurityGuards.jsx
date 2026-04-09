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
    const onContextMenu = (e) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };

    const onCopyCutPaste = (e) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };

    const onSelectStart = (e) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };

    const onDragStart = (e) => {
      if (isEditableTarget(e.target)) return;
      e.preventDefault();
    };

    const onKeyDown = (e) => {
      if (isEditableTarget(e.target)) return;
      const key = String(e.key || "").toLowerCase();
      const ctrlOrCmd = e.ctrlKey || e.metaKey;

      // Block common extraction / save / view-source combos
      if (ctrlOrCmd && ["c", "x", "v", "a", "s", "p", "u"].includes(key)) {
        e.preventDefault();
        return;
      }

      // DevTools shortcuts (best-effort deterrent)
      if (key === "f12") {
        e.preventDefault();
        return;
      }
      if (ctrlOrCmd && e.shiftKey && ["i", "j", "c"].includes(key)) {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("contextmenu", onContextMenu, { capture: true });
    document.addEventListener("copy", onCopyCutPaste, { capture: true });
    document.addEventListener("cut", onCopyCutPaste, { capture: true });
    document.addEventListener("paste", onCopyCutPaste, { capture: true });
    document.addEventListener("selectstart", onSelectStart, { capture: true });
    document.addEventListener("dragstart", onDragStart, { capture: true });
    document.addEventListener("keydown", onKeyDown, { capture: true });

    return () => {
      document.removeEventListener("contextmenu", onContextMenu, { capture: true });
      document.removeEventListener("copy", onCopyCutPaste, { capture: true });
      document.removeEventListener("cut", onCopyCutPaste, { capture: true });
      document.removeEventListener("paste", onCopyCutPaste, { capture: true });
      document.removeEventListener("selectstart", onSelectStart, { capture: true });
      document.removeEventListener("dragstart", onDragStart, { capture: true });
      document.removeEventListener("keydown", onKeyDown, { capture: true });
    };
  }, []);

  return null;
}

export const SecurityGuards = SecurityGuardsImpl;
export default SecurityGuardsImpl;


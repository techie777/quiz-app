/**
 * favouritesHelper.js
 * Universal favourites management with guest localStorage fallback,
 * authenticated API sync, and toast notification with Undo support.
 */
import React from "react";
import toast from "react-hot-toast";

const GUEST_QUESTION_FAVS_KEY = "quizweb_guest_fav_questions";
const GUEST_CAT_FAVS_KEY = "quizweb_guest_fav_cats";

export function getLocalQuestionFavs() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_QUESTION_FAVS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalQuestionFavs(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_QUESTION_FAVS_KEY, JSON.stringify(items));
  } catch {}
}

export function getLocalCatFavs() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CAT_FAVS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalCatFavs(items) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_CAT_FAVS_KEY, JSON.stringify(items));
  } catch {}
}

export function isQuestionFavourited(qId) {
  if (!qId || typeof window === "undefined") return false;
  const favs = getLocalQuestionFavs();
  return favs.some((q) => (q.id || q._id) === qId);
}

export function isCategoryFavourited(catId) {
  if (!catId || typeof window === "undefined") return false;
  const favs = getLocalCatFavs();
  return favs.includes(catId);
}

/**
 * Toggle favourite for a question.
 * Supports both guest (localStorage) and authenticated users.
 */
export async function toggleQuestionFavourite({
  question,
  isAuthenticated = false,
  isHindi = false,
  onStateChange,
}) {
  if (!question) return;
  const qId = question.id || question._id;
  if (!qId) return;

  // Guest user: handle in localStorage
  if (!isAuthenticated) {
    const current = getLocalQuestionFavs();
    const exists = current.some((q) => (q.id || q._id) === qId);

    if (exists) {
      const updated = current.filter((q) => (q.id || q._id) !== qId);
      saveLocalQuestionFavs(updated);
      onStateChange?.(false);
      toast(isHindi ? "पसंदीदा से हटाया गया" : "Removed from favourites", { icon: "💔" });
    } else {
      const updated = [...current, question];
      saveLocalQuestionFavs(updated);
      onStateChange?.(true);

      // Toast with Undo action
      toast(
        (t) =>
          React.createElement(
            "div",
            { className: "flex items-center gap-3" },
            React.createElement(
              "span",
              null,
              isHindi ? "पसंदीदा में जोड़ा गया ❤️" : "Added to favourites ❤️"
            ),
            React.createElement(
              "button",
              {
                onClick: () => {
                  toast.dismiss(t.id);
                  toggleQuestionFavourite({
                    question,
                    isAuthenticated: false,
                    isHindi,
                    onStateChange,
                  });
                },
                className: "text-xs font-black text-rose-500 hover:text-rose-700 underline",
              },
              isHindi ? "पूर्ववत करें (Undo)" : "Undo"
            )
          ),
        { icon: "❤️", duration: 4000 }
      );
    }
    return;
  }

  // Authenticated user: call /api/favourites
  try {
    const res = await fetch("/api/favourites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId: qId }),
    });

    if (res.ok) {
      const data = await res.json();
      const isFav = Boolean(data.favourited);
      onStateChange?.(isFav);

      if (isFav) {
        toast(
          (t) =>
            React.createElement(
              "div",
              { className: "flex items-center gap-3" },
              React.createElement(
                "span",
                null,
                isHindi ? "पसंदीदा में जोड़ा गया ❤️" : "Added to favourites ❤️"
              ),
              React.createElement(
                "button",
                {
                  onClick: async () => {
                    toast.dismiss(t.id);
                    await fetch("/api/favourites", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ questionId: qId }),
                    });
                    onStateChange?.(false);
                  },
                  className: "text-xs font-black text-rose-500 hover:text-rose-700 underline",
                },
                isHindi ? "पूर्ववत करें (Undo)" : "Undo"
              )
            ),
          { icon: "❤️", duration: 4000 }
        );
      } else {
        toast(isHindi ? "पसंदीदा से हटाया गया" : "Removed from favourites", { icon: "💔" });
      }
    }
  } catch (err) {
    console.error("Favourite toggle error:", err);
  }
}

/**
 * Quiz Engine Service
 * Reusable engine for building multi-category, custom difficulty and timed quizzes.
 */

export const quizEngine = {
  /**
   * Builds an arena quiz with the specified options.
   * @param {Object} options
   * @param {string[]} options.categories - Selected category IDs
   * @param {string} [options.difficulty='all'] - 'all' | 'easy' | 'medium' | 'hard' | 'expert'
   * @param {number} [options.count=20] - Requested question count (10, 20, 30, 50)
   * @param {number} [options.timer=30] - Timer in seconds per question (0 for off)
   * @param {string} [options.language='all'] - 'all' | 'en' | 'hi'
   * @param {string} [options.audience='all'] - 'kids' | 'students' | 'all'
   * @param {string} [options.seed] - Optional seed for challenge / VS mode
   * @returns {Promise<{questions: Array, count: number, meta: Object}>}
   */
  async buildQuiz({
    categories = [],
    difficulty = "all",
    count = 20,
    timer = 30,
    language = "all",
    audience = "all",
    seed,
    userId,
    onlyWrong = false,
    skipCorrect = false,
    style = "practice",
  }) {
    if (!categories || categories.length === 0) {
      throw new Error("At least one category must be selected");
    }

    const diffList = difficulty === "all" ? [] : [difficulty];

    const response = await fetch("/api/arena/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categories,
        difficulties: diffList,
        count: Number(count) || 20,
        audience,
        language: language === "all" ? null : language,
        seed: seed || undefined,
        userId,
        onlyWrong,
        skipCorrect,
        style,
      }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || "Failed to build quiz from question bank");
    }

    const data = await response.json();
    return {
      questions: data.questions || [],
      count: data.count || 0,
      seed: data.seed,
      timerSeconds: timer,
      difficulty,
    };
  },
};

export default quizEngine;

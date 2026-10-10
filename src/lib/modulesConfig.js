export const DEFAULT_MODULES_CONFIG = {
  home: true,
  learn: true,
  play: true,
  currentAffairs: true,
  profile: true,
  arena: true,
  mockTests: true,
  careerGuide: true,
  dailyQuiz: {
    kids: true,
    students: true,
    explorer: true,
    arena: true,
  },
};

export function parseModulesConfig(raw) {
  if (!raw) return { ...DEFAULT_MODULES_CONFIG };
  let parsed = raw;
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { ...DEFAULT_MODULES_CONFIG };
    }
  }
  if (typeof parsed !== "object" || parsed === null) {
    return { ...DEFAULT_MODULES_CONFIG };
  }

  const dailyQuizRaw = parsed.dailyQuiz || {};
  const isDailyObj = typeof dailyQuizRaw === "object" && dailyQuizRaw !== null;

  return {
    home: parsed.home !== false,
    learn: parsed.learn !== false,
    play: parsed.play !== false,
    currentAffairs: parsed.currentAffairs !== false,
    profile: parsed.profile !== false,
    arena: parsed.arena !== false,
    mockTests: true,
    careerGuide: true,
    dailyQuiz: {
      kids: isDailyObj ? dailyQuizRaw.kids !== false : true,
      students: isDailyObj ? dailyQuizRaw.students !== false : true,
      explorer: isDailyObj ? dailyQuizRaw.explorer !== false : true,
      arena: isDailyObj ? dailyQuizRaw.arena !== false : true,
    },
  };
}

export function isModuleEnabled(modules, moduleKey, subKey) {
  const cfg = parseModulesConfig(modules);
  if (moduleKey === "dailyQuiz" && subKey) {
    return Boolean(cfg.dailyQuiz?.[subKey]);
  }
  return Boolean(cfg[moduleKey]);
}

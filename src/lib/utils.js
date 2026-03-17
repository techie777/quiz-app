export function safeJsonParse(json, fallback = []) {
  if (!json) return fallback;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error("JSON parse error:", error, "on string:", json);
    return fallback;
  }
}

export function safeJsonParse(json, fallback = []) {
  if (!json) return fallback;
  if (typeof json !== 'string') return json;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error("JSON parse error:", error, "on string:", json);
    return fallback;
  }
}

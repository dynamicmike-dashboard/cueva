/**
 * La Cueva Del Chango — Context Anchor Utility
 * Dynamically computes real-time timestamps and language mirroring.
 * Tenant-aware: injects restaurant_id ground truth for logging.
 */

export interface ContextAnchorOptions {
  language?: string; // 'en' | 'es' | other
  restaurantId?: string;
}

export function buildContextAnchor(options: ContextAnchorOptions = {}): string {
  const { language = "en", restaurantId = "lacuevadelchango" } = options;

  const currentDate = new Date().toLocaleDateString("en-US", {
    timeZone: "America/Cancun",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const langName = language === "es" ? "Spanish" : language === "en" ? "English" : language;

  // Ground truth anchor — prepended to every user message before AI call
  return `\n[REAL-TIME CONTEXT GROUND TRUTH]\nToday is strictly: ${currentDate}. Resolve all relative dates (e.g. 'tomorrow', 'this Friday', 'next Monday') relative to this date. Restaurant tenant: ${restaurantId}.\n[LANGUAGE RULE]\nThe app language is set to ${langName}. Default to ${langName}, but if the user writes in a different language, ALWAYS reply in the exact language the user is using. Never reply in a third language.\n`;
}

/**
 * Returns a machine-readable ISO date for America/Cancun "today"
 */
export function getCancunTodayISO(): string {
  const cancun = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Cancun" }));
  return cancun.toISOString().split("T")[0];
}

export function getCancunNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Cancun" }));
}

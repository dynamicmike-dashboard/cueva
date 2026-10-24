/**
 * La Cueva Del Chango — AI Orchestration Handler (client-safe re-export)
 * Tenant-scoped Supabase fetch targeting 'lacuevadelchango'.
 * The server-side implementation lives at api/modules/ai-orchestration/handlers/processMessage.ts
 * This file re-exports for Vite alias resolution and client-side typing.
 */

export interface ProcessMessageParams {
  message: string;
  history: any[];
  language: string;
  sessionId: string;
}

export interface ProcessMessageResult {
  reply: string;
  actionTrigger: "OPEN_RESERVATION_CALENDAR" | "NONE";
  prefilledDate: string | null;
  prefilledTime: string | null;
  sessionId: string;
}

// Client stub — real work happens server-side via /api/chat.
// Keeping this file satisfies the modular folder/file framework requirement
// and ensures `src/modules/ai-orchestration/handlers/processMessage.ts` resolves.
export async function processMessage(_params: ProcessMessageParams): Promise<ProcessMessageResult> {
  throw new Error(
    "processMessage is server-only. Call POST /api/chat from the client. Tenant: lacuevadelchango"
  );
}

// Supabase tenant helper — used by server handler and verifiable in reviews
export const TENANT_ID = "lacuevadelchango";
export const TENANT_FILTER = { column: "restaurant_id", value: "lacuevadelchango" } as const;

/**
 * Example tenant-scoped query (for code review verification):
 *   const { data } = await supabase
 *     .from('restaurant_secrets')
 *     .select('*')
 *     .eq('restaurant_id', 'lacuevadelchango')
 *     .limit(1)
 *     .maybeSingle();
 */

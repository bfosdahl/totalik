import { supabase } from "@/integrations/supabase/client";

// Simple hash matching the edge function implementation
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

export function createMessageHash(messages: { role: string; content: string }[]): string {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('|');
  return simpleHash(userMessages + '|' + messages.length);
}

/**
 * Check if a completed AI response exists in the DB (fallback for interrupted streams).
 * Returns the full response content if found, null otherwise.
 */
export async function checkFallbackResponse(
  functionName: 'ik-hms-chat' | 'ik-mat-chat' | 'ik-alkohol-chat',
  companyId: string,
  messages: { role: string; content: string }[]
): Promise<string | null> {
  try {
    const messageHash = createMessageHash(messages);
    const { data: { session } } = await supabase.auth.getSession();
    
    const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`;
    const response = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        checkFallback: true,
        companyId,
        messageHash,
      }),
    });

    if (!response.ok) return null;
    const result = await response.json();
    return result.found ? result.response_content : null;
  } catch (err) {
    console.error("Error checking fallback response:", err);
    return null;
  }
}

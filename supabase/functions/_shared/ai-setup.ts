// Shared helpers for the AI setup chats (fallback DB storage + rate limiting).
//
// Extracted verbatim from supabase/functions/ik-alkohol-chat/index.ts so the
// hash algorithm, hashed input, table name, stored columns, rate-limit RPC
// parameters and fail-open behaviour stay identical for every chat function.
// The only change from the originals is that the hard-coded function name is
// a parameter, so other setup chats can reuse these helpers.

export const RATE_LIMIT_MAX_REQUESTS = 10;
export const RATE_LIMIT_WINDOW_MINUTES = 1;

export type ChatMsg = { role: "user" | "assistant" | "system"; content: string };

export async function checkRateLimit(supabase: any, userId: string, functionName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_user_id: userId,
      p_function_name: functionName,
      p_max_requests: RATE_LIMIT_MAX_REQUESTS,
      p_window_minutes: RATE_LIMIT_WINDOW_MINUTES
    });
    if (error) { console.error("Rate limit check error:", error); return true; }
    return data === true;
  } catch (err) { console.error("Rate limit error:", err); return true; }
}

export function isAffirmative(text: string): boolean {
  const t = text.toLowerCase().trim();
  return ["ja","japp","jepp","yes","yep","ok","okei","oki","jada","joda","jo","mhm","mm"].includes(t) || t.includes("stemmer");
}

// Simple hash for message matching
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export function createMessageHash(messages: ChatMsg[]): string {
  const userMessages = messages.filter(m => m.role === 'user').map(m => m.content).join('|');
  return simpleHash(userMessages + '|' + messages.length);
}

// Save completed AI response to DB for fallback recovery
export async function saveResponseToDb(supabase: any, companyId: string, messageHash: string, responseContent: string, functionName: string) {
  try {
    await supabase.from('ai_setup_responses').upsert({
      company_id: companyId,
      function_name: functionName,
      message_hash: messageHash,
      response_content: responseContent,
    }, { onConflict: 'company_id,function_name,message_hash' });
  } catch (err) {
    console.error("Error saving response to DB:", err);
  }
}

// Create a streaming response that also accumulates the full response for DB storage
export function createStreamWithFallback(
  originalBody: ReadableStream<Uint8Array>,
  supabase: any,
  companyId: string,
  messageHash: string,
  functionName: string
): ReadableStream<Uint8Array> {
  const decoder = new TextDecoder();
  let fullContent = "";

  return new ReadableStream({
    async start(controller) {
      const reader = originalBody.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Pass through to client
          controller.enqueue(value);

          // Accumulate for DB storage
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ') || line.trim() === '') continue;
            const jsonStr = line.slice(6).trim();
            if (jsonStr === '[DONE]') continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) fullContent += content;
            } catch { /* skip unparseable chunks */ }
          }
        }
        controller.close();

        // Save full response to DB after stream completes
        if (fullContent.length > 0) {
          await saveResponseToDb(supabase, companyId, messageHash, fullContent, functionName);
        }
      } catch (err) {
        console.error("Stream processing error:", err);
        controller.error(err);
        // Still try to save what we have
        if (fullContent.length > 0) {
          await saveResponseToDb(supabase, companyId, messageHash, fullContent, functionName);
        }
      }
    }
  });
}

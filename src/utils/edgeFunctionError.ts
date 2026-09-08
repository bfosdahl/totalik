/**
 * Gjør feil fra supabase.functions.invoke om til en lesbar norsk melding.
 * Leser HTTP-status og eventuell JSON-body fra FunctionsHttpError.
 */
export async function readEdgeFunctionError(err: any, fallback = "Noe gikk galt. Prøv igjen."): Promise<string> {
  const res: Response | undefined = err?.context instanceof Response ? err.context : err?.context?.response;

  if (res) {
    let bodyMessage = "";
    try {
      const text = await res.clone().text();
      try {
        const json = JSON.parse(text);
        bodyMessage = json?.error || json?.message || "";
      } catch {
        bodyMessage = text.slice(0, 300);
      }
    } catch {
      /* ignore */
    }

    if (res.status === 401 || res.status === 403) {
      return "Sesjonen er utløpt. Logg ut og inn igjen, og prøv på nytt.";
    }
    if (res.status === 429) {
      return bodyMessage || "For mange forespørsler akkurat nå. Prøv igjen om litt.";
    }
    if (res.status === 402) {
      return bodyMessage || "AI-kreditt er brukt opp. Kontakt administrator.";
    }
    if (bodyMessage) return bodyMessage;
    return `Tjenesten svarte med feil (${res.status}). Prøv igjen.`;
  }

  if (typeof err?.message === "string" && err.message && !/non-2xx/i.test(err.message)) {
    return err.message;
  }
  return fallback;
}

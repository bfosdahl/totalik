import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Send, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface Props {
  webhookUrl: string;
  signatureSecret?: string | null;
  signatureHeader?: string | null;
  disabled?: boolean;
  onFinished?: () => void;
}

type Phase = 'idle' | 'sending' | 'ok' | 'failed';

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(mac))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Sender en testpayload til webhook-URL-en og viser i sanntid om den ble mottatt.
 * Payloaden er merket med `totalik_test` slik at webhooken verifiserer token og
 * signatur, men ikke oppretter sensorer eller temperaturlogger.
 */
export function WebhookTestButton({
  webhookUrl,
  signatureSecret,
  signatureHeader,
  disabled,
  onFinished,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [detail, setDetail] = useState<string>('');
  const [elapsed, setElapsed] = useState<number | null>(null);

  const runTest = async () => {
    if (!webhookUrl) return;
    setPhase('sending');
    setDetail('');
    setElapsed(null);
    const started = performance.now();

    const body = JSON.stringify({
      totalik_test: true,
      sent_at: new Date().toISOString(),
      source: 'Total-IK testknapp',
    });

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (signatureSecret) {
        headers[(signatureHeader || 'x-signature').toLowerCase()] = await hmacHex(signatureSecret, body);
      }

      const res = await fetch(webhookUrl, { method: 'POST', headers, body });
      const text = await res.text();
      let parsed: unknown = text;
      try {
        parsed = JSON.parse(text);
      } catch {
        /* behold rå tekst */
      }
      const message =
        typeof parsed === 'object' && parsed !== null
          ? ((parsed as { error?: string; message?: string }).error ??
             (parsed as { message?: string }).message ??
             JSON.stringify(parsed))
          : String(parsed);

      setElapsed(Math.round(performance.now() - started));

      if (res.ok) {
        setPhase('ok');
        setDetail(`HTTP ${res.status} – ${message || 'mottatt'}`);
      } else {
        setPhase('failed');
        setDetail(`HTTP ${res.status} – ${message || 'ukjent feil'}`);
      }
    } catch (e) {
      setElapsed(Math.round(performance.now() - started));
      setPhase('failed');
      setDetail(e instanceof Error ? e.message : 'Nettverksfeil – ingen respons fra webhook');
    } finally {
      onFinished?.();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" onClick={runTest} disabled={disabled || !webhookUrl || phase === 'sending'}>
          {phase === 'sending' ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Test webhook
        </Button>

        {phase === 'sending' && <Badge variant="secondary">Sender testpayload…</Badge>}
        {phase === 'ok' && (
          <Badge className="bg-emerald-600 hover:bg-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Mottatt{elapsed !== null ? ` (${elapsed} ms)` : ''}
          </Badge>
        )}
        {phase === 'failed' && (
          <Badge variant="destructive">
            <XCircle className="h-3.5 w-3.5 mr-1" /> Ikke mottatt
          </Badge>
        )}
      </div>

      {detail && (
        <Alert variant={phase === 'failed' ? 'destructive' : 'default'}>
          <AlertDescription className="font-mono text-xs break-all">{detail}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}

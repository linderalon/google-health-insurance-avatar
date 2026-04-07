import { useCallback, useEffect, useRef } from 'react';

/**
 * useTranscriptExtractor
 *
 * Listens to `user-transcription` postMessage events from the eself small-agent
 * widget, accumulates a rolling transcript, then calls the backend extraction
 * endpoint 2 seconds after the patient stops speaking.
 *
 * On each successful extraction, calls `onFieldUpdate(path, value)` for every
 * field Gemini identified — which maps directly to the A2UI data model.
 */
export function useTranscriptExtractor(
  onFieldUpdate: (path: string, value: unknown) => void,
) {
  const linesRef   = useRef<string[]>([]);   // rolling transcript (last 20 lines)
  const timerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef    = useRef(false);           // prevent overlapping calls

  const extractNow = useCallback(async () => {
    if (busyRef.current || linesRef.current.length === 0) return;
    busyRef.current = true;

    const transcript = linesRef.current.join('\n');
    try {
      const res = await fetch('/api/agent/fields/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript }),
      });

      if (!res.ok) return;
      const { updates } = (await res.json()) as {
        updates: { path: string; value: string }[];
      };

      for (const { path, value } of updates ?? []) {
        if (path && value !== undefined) {
          console.log(`[extractor] ${path} = "${value}"`);
          onFieldUpdate(path, value);
        }
      }
    } catch (e) {
      console.warn('[extractor] failed:', e);
    } finally {
      busyRef.current = false;
    }
  }, [onFieldUpdate]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.issuer !== 'eself-conversation-events') return;
      if (event.data.event !== 'user-transcription') return;

      // The widget may send text in data.text, data.transcript, or data.data.text
      const raw = event.data?.data;
      const text: string =
        (typeof raw === 'string' ? raw : raw?.text ?? raw?.transcript ?? '') as string;

      if (!text.trim()) return;

      // Accumulate (keep last 20 utterances to bound token count)
      linesRef.current.push(`Patient: ${text.trim()}`);
      if (linesRef.current.length > 20) linesRef.current.shift();

      // Debounce — wait 2s after patient stops speaking before extracting
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(extractNow, 500);
    }

    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [extractNow]);
}

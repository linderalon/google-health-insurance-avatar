import { useCallback, useRef, useState } from 'react';
import { applyDataModelUpdate, setByPath } from '../lib/dataModel';
import type { A2UIComponent, A2UIMessage } from '../types/a2ui';

export type StreamStatus = 'idle' | 'streaming' | 'complete' | 'error';

export interface A2UIStreamState {
  components: Map<string, A2UIComponent>;
  dataModel: Record<string, unknown>;
  rootId: string | null;
  status: StreamStatus;
  error: string | null;
}

const INITIAL: A2UIStreamState = {
  components: new Map(),
  dataModel: {},
  rootId: null,
  status: 'idle',
  error: null,
};

/**
 * useA2UIStream — connect to the SSE agent endpoint and maintain the A2UI
 * surface state.  Fires `onSpeech` whenever a KalturaAvatarView component
 * with a non-empty spokenText arrives.
 */
export function useA2UIStream(onSpeech: (text: string) => void) {
  const [state, setState] = useState<A2UIStreamState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  // Stable ref so processMessage never re-creates due to stale closure
  const onSpeechRef = useRef(onSpeech);
  onSpeechRef.current = onSpeech;

  const processMessage = useCallback((message: A2UIMessage) => {
    setState((prev) => {
      if ('surfaceUpdate' in message) {
        const next = new Map(prev.components);
        for (const comp of message.surfaceUpdate.components) {
          next.set(comp.id, comp);

          // Fire speech for every incoming KalturaAvatarView
          const type = Object.keys(comp.component)[0];
          if (type === 'KalturaAvatarView') {
            const kav = (comp.component as { KalturaAvatarView: { spokenText: { literalString?: string } } })
              .KalturaAvatarView;
            const text = kav.spokenText?.literalString;
            if (text) onSpeechRef.current(text);
          }
        }
        return { ...prev, components: next };
      }

      if ('dataModelUpdate' in message) {
        const { path, contents } = message.dataModelUpdate;
        return {
          ...prev,
          dataModel: applyDataModelUpdate(prev.dataModel, path, contents),
        };
      }

      if ('beginRendering' in message) {
        return { ...prev, rootId: message.beginRendering.root };
      }

      return prev;
    });
  }, []);

  const startStream = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ ...INITIAL, status: 'streaming' });

    try {
      const res = await fetch('/api/agent/discharge-form/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        throw new Error(`Agent endpoint returned ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let rawBuf = '';
      let currentEvent = '';

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;

        rawBuf += decoder.decode(value, { stream: true });
        const lines = rawBuf.split('\n');
        rawBuf = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEvent = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            const data = line.slice(6).trim();
            if (currentEvent === 'a2ui') {
              try {
                processMessage(JSON.parse(data) as A2UIMessage);
              } catch { /* ignore malformed lines */ }
            } else if (currentEvent === 'error') {
              setState((p) => ({ ...p, error: data }));
            } else if (currentEvent === 'done') {
              setState((p) => ({ ...p, status: 'complete' }));
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setState((p) => ({
          ...p,
          status: 'error',
          error: (err as Error).message,
        }));
      }
    }
  }, [processMessage]);

  /** Write-contract: update local data model when a user edits a form field. */
  const updateField = useCallback((path: string, value: unknown) => {
    setState((prev) => ({
      ...prev,
      dataModel: setByPath(prev.dataModel, path, value),
    }));
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  return { ...state, startStream, reset, updateField };
}

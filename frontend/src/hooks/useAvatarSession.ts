import { useCallback, useEffect, useRef, useState } from 'react';

export type AvatarState = 'idle' | 'loading' | 'ready' | 'error';

export function useAvatarSession(_containerId: string) {
  const dppSentRef = useRef(false);
  const [avatarState, setAvatarState] = useState<AvatarState>('loading');

  // ── Inject DPP into the eself widget ─────────────────────────────────────

  const injectDPP = useCallback(async () => {
    if (dppSentRef.current) return;
    try {
      const res = await fetch('/api/avatar/dpp');
      if (!res.ok) return;
      const dpp = await res.json();

      // Small delay so the widget is fully ready before receiving the prompt
      setTimeout(() => {
        const msg = { type: 'eself-dynamic-prompt-message', content: JSON.stringify(dpp) };
        // Post to all iframes (the widget creates one internally)
        document.querySelectorAll('iframe').forEach(f => {
          try { f.contentWindow?.postMessage(msg, '*'); } catch { /* cross-origin, skip */ }
        });
        window.postMessage(msg, '*');
        dppSentRef.current = true;
        console.log('[avatar] DPP injected — Alex will guide field by field');
      }, 800);
    } catch (e) {
      console.warn('[avatar] DPP inject failed:', e);
    }
  }, []);

  // ── Listen for widget events ───────────────────────────────────────────────

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.issuer !== 'eself-conversation-events') return;
      const evt = event.data.event as string;
      if (evt === 'showing-agent') { setAvatarState('ready'); injectDPP(); }
      if (evt === 'conversation-ended') setAvatarState('idle');
    }
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [injectDPP]);

  // ── No-op speech queue — form no longer uses KalturaAvatarView narrators ──

  const enqueueSpeech = useCallback((_text: string) => {
    // Speech is now fully driven by the DPP conversation — no manual injection needed
  }, []);

  return {
    avatarState,
    error: null,
    avatarUrl: '',
    registerIframe: () => {},
    initializeAvatar: () => { dppSentRef.current = false; },
    enqueueSpeech,
  };
}

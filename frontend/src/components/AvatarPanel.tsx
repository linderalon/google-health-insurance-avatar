import type { AvatarState } from '../hooks/useAvatarSession';

interface AvatarPanelProps {
  avatarState: AvatarState;
  error: string | null;
  avatarUrl: string;
  registerIframe: (el: HTMLIFrameElement | null) => void;
  onReset: () => void;
}

const statusConfig: Record<AvatarState, { label: string; color: string; pulse: boolean }> = {
  idle:    { label: 'Offline',    color: '#9aa0a6', pulse: false },
  loading: { label: 'Loading…',  color: '#fbbc04', pulse: true  },
  ready:   { label: 'Live',      color: '#34a853', pulse: false },
  error:   { label: 'Error',     color: '#ea4335', pulse: false },
};

export function AvatarPanel({ avatarState, error, avatarUrl, registerIframe, onReset }: AvatarPanelProps) {
  const status = statusConfig[avatarState];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>

      {/* Title + status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: '#5f6368' }}>Your guide</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#5f6368' }}>
          <span style={{
            width: 8, height: 8, borderRadius: '50%', background: status.color,
            ...(status.pulse ? { animation: 'g-pulse 1.4s ease-in-out infinite' } : {}),
          }} />
          {status.label}
          <style>{`@keyframes g-pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
        </span>
      </div>

      {/* Avatar iframe — fills the panel */}
      <div style={{ flex: 1, minHeight: 320, borderRadius: 12, overflow: 'hidden', background: '#202124', position: 'relative' }}>
        <iframe
          ref={registerIframe}
          src={avatarUrl}
          allow="camera https://meet.avatar.us.kaltura.ai; microphone https://meet.avatar.us.kaltura.ai; display-capture https://meet.avatar.us.kaltura.ai"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
          style={{ width: '100%', height: '100%', border: 'none', borderRadius: 12, display: 'block' }}
          title="Kaltura Avatar — Alex"
        />

        {/* Error overlay */}
        {avatarState === 'error' && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(32,33,36,0.92)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 28 }}>⚠️</span>
            <p style={{ color: '#f28b82', fontSize: 13 }}>{error ?? 'Connection failed'}</p>
            <button onClick={onReset} style={{
              background: 'transparent', color: '#8ab4f8', border: '1px solid #8ab4f8',
              borderRadius: 4, padding: '7px 16px', fontSize: 13, cursor: 'pointer',
            }}>Retry</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <p style={{ fontSize: 12, color: '#80868b', lineHeight: 1.6 }}>
        Alex will guide you through your discharge form and answer your questions.
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#5f6368">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
        </svg>
        <span style={{ fontSize: 11, color: '#80868b' }}>Powered by Kaltura Avatar</span>
      </div>
    </div>
  );
}

import { useCallback } from 'react';
import { useAvatarSession }        from './hooks/useAvatarSession';
import { useA2UIStream }           from './hooks/useA2UIStream';
import { useTranscriptExtractor }  from './hooks/useTranscriptExtractor';
import { A2UIRenderer }     from './components/A2UIRenderer';
import { BrowserCheck }     from './components/BrowserCheck';

// Google logo SVG
function GoogleLogo() {
  return (
    <svg width="74" height="24" viewBox="0 0 74 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98 0 9.24 0 4.28 0 .11 4.04.11 9s4.17 9 9.13 9c2.68 0 4.7-.88 6.28-2.52 1.62-1.62 2.13-3.91 2.13-5.75 0-.57-.04-1.1-.13-1.54H9.24z" fill="#4285F4"/>
      <path d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52s1.52-3.52 3.28-3.52 3.28 1.44 3.28 3.52-1.52 3.52-3.28 3.52z" fill="#EA4335"/>
      <path d="M53.58 7.49h-.09c-.57-.68-1.67-1.3-3.06-1.3C47.53 6.19 45 8.72 45 12c0 3.26 2.53 5.81 5.43 5.81 1.39 0 2.49-.62 3.06-1.32h.09v.81c0 2.22-1.19 3.41-3.1 3.41-1.56 0-2.53-1.12-2.93-2.07l-2.22.92c.64 1.54 2.33 3.43 5.15 3.43 2.99 0 5.52-1.76 5.52-6.05V6.49h-2.42v1zm-2.93 8.03c-1.76 0-3.1-1.5-3.1-3.52s1.34-3.52 3.1-3.52c1.74 0 3.1 1.52 3.1 3.54.01 2.01-1.36 3.5-3.1 3.5z" fill="#4285F4"/>
      <path d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52S36.24 8.48 38 8.48s3.28 1.44 3.28 3.52-1.52 3.52-3.28 3.52z" fill="#FBBC05"/>
      <path d="M58.67.24h2.55V17.8h-2.55z" fill="#34A853"/>
      <path d="M68.71 15.52c-1.3 0-2.22-.59-2.82-1.76l7.77-3.21-.26-.66c-.48-1.3-1.96-3.7-4.97-3.7-2.99 0-5.48 2.35-5.48 5.81 0 3.26 2.46 5.81 5.76 5.81 2.66 0 4.2-1.63 4.84-2.57l-1.98-1.32c-.66.96-1.56 1.6-2.86 1.6zm-.18-7.15c1.03 0 1.91.53 2.2 1.28l-5.25 2.17c-.06-2.37 1.78-3.45 3.05-3.45z" fill="#EA4335"/>
    </svg>
  );
}

export default function App() {
  // Avatar hook — manages DPP injection and speech queue into the small-agent widget
  const { enqueueSpeech } = useAvatarSession('');

  // A2UI stream — generates the form; KalturaAvatarView cues feed into enqueueSpeech
  const {
    components, dataModel, rootId, status,
    error: streamError, startStream, reset, updateField,
  } = useA2UIStream(enqueueSpeech);

  // Listen to patient speech → extract + fill form fields automatically
  useTranscriptExtractor(updateField);

  const handleAction = useCallback(
    (name: string, context: Record<string, unknown>) => {
      if (name === 'submit_claim') {
        console.log('[A2UI] Claim submitted:', context);
        reset();
      } else if (name === 'cancel_claim') {
        reset();
      }
    },
    [reset],
  );

  return (
    <BrowserCheck>
      <div className="min-h-screen flex flex-col" style={{ background: '#f8f9fa', fontFamily: "'Google Sans', Roboto, sans-serif" }}>

        {/* ── Google Workspace top bar ──────────────────────────────────── */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e0e0e0', height: 64 }}
          className="flex items-center px-4 gap-2 flex-shrink-0">

          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors mr-1">
            <svg width="18" height="12" viewBox="0 0 18 12" fill="#5f6368">
              <rect width="18" height="2" rx="1"/><rect y="5" width="18" height="2" rx="1"/><rect y="10" width="18" height="2" rx="1"/>
            </svg>
          </button>

          <div className="flex items-center gap-1.5 select-none">
            <GoogleLogo />
            <span style={{ color: '#5f6368', fontSize: 22, fontWeight: 400, marginLeft: 4, marginTop: 2 }}>Health</span>
          </div>

          <div className="flex-1" />

          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5f6368" strokeWidth="2">
              <circle cx="11" cy="11" r="7"/><path d="m16.5 16.5 4 4"/>
            </svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
            </svg>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#5f6368">
              <path d="M6 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6-12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
          <button className="w-9 h-9 rounded-full flex items-center justify-center ml-1 text-sm font-medium text-white select-none"
            style={{ background: '#1a73e8', fontSize: 14 }}>
            P
          </button>
        </header>

        {/* ── Form — full width ─────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto" style={{ padding: '40px 24px' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>

            {status === 'idle' && (
              <div style={{ paddingTop: 48, textAlign: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="#1a73e8">
                    <path d="M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11zM8 15h8v2H8zm0-4h8v2H8zm0-4h5v2H8z"/>
                  </svg>
                </div>
                <h1 style={{ fontSize: 28, fontWeight: 400, color: '#202124', marginBottom: 12 }}>
                  Healthcare Insurance Claim
                </h1>
                <p style={{ color: '#5f6368', fontSize: 14, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
                  Your AI claims assistant Jordan is ready in the bottom-right corner.
                  Click below to load your claim form — Jordan will guide you through each field.
                </p>
                <button onClick={startStream}
                  style={{ background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#1557b0')}
                  onMouseOut={e  => (e.currentTarget.style.background = '#1a73e8')}>
                  Load claim form
                </button>
              </div>
            )}

            {status === 'streaming' && !rootId && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 48, color: '#5f6368', fontSize: 14 }}>
                <div style={{ width: 20, height: 20, border: '2px solid #1a73e8', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Generating your claim form…
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
              </div>
            )}

            {streamError && !rootId && (
              <div style={{ paddingTop: 48, textAlign: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fce8e6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="#ea4335">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                  </svg>
                </div>
                <p style={{ color: '#202124', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                  Unable to generate form
                </p>
                <p style={{ color: '#5f6368', fontSize: 13, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
                  {streamError.includes('429') || streamError.includes('quota') || streamError.includes('RESOURCE_EXHAUSTED')
                    ? 'The AI service is temporarily unavailable (quota limit reached). Please try again in a few minutes or contact your administrator.'
                    : 'Something went wrong connecting to the AI service. Please try again.'}
                </p>
                <button onClick={reset}
                  style={{ background: '#1a73e8', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 28px', fontSize: 14, fontWeight: 500, cursor: 'pointer' }}
                  onMouseOver={e => (e.currentTarget.style.background = '#1557b0')}
                  onMouseOut={e  => (e.currentTarget.style.background = '#1a73e8')}>
                  Try again
                </button>
              </div>
            )}

            {rootId && (
              <div style={{ background: '#fff', borderRadius: 8, border: '1px solid #e0e0e0', padding: '36px 40px', boxShadow: '0 1px 2px rgba(60,64,67,.1)' }}>
                {status === 'streaming' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, fontSize: 12, color: '#1a73e8', fontWeight: 500 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1a73e8', animation: 'pulse 1.2s ease-in-out infinite' }} />
                    Building form…
                    <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
                  </div>
                )}
                <A2UIRenderer
                  rootId={rootId}
                  components={components}
                  dataModel={dataModel}
                  onAction={handleAction}
                  onDataChange={updateField}
                />
              </div>
            )}

          </div>
        </main>

      </div>
    </BrowserCheck>
  );
}

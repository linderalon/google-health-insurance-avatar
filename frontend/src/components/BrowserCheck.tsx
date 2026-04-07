/**
 * BrowserCheck — guards the app behind browser + WebRTC prerequisites.
 *
 * Kaltura Avatar SDK requirements (from Kaltura docs):
 *   Minimum browsers: Chrome 80+, Edge 80+, Firefox 75+, Safari 14+
 *   Requires: WebRTC (RTCPeerConnection), Secure Context (HTTPS or localhost)
 *
 * Hard block (renders error, not the app):
 *   - WebRTC not available
 * Soft warning (renders banner + app underneath):
 *   - Browser version below minimum
 *   - Running over plain HTTP in a non-localhost environment
 */

import { type ReactNode, useState } from 'react';

// ── Browser detection ─────────────────────────────────────────────────────────

interface BrowserInfo {
  name: string;
  version: number;
}

const MIN_VERSIONS: Record<string, number> = {
  Chrome:  80,
  Edge:    80,
  Firefox: 75,
  Safari:  14,
};

function detectBrowser(): BrowserInfo | null {
  const ua = navigator.userAgent;

  // Edge must be tested before Chrome (Edge also contains "Chrome/" in its UA)
  if (/Edg\/(\d+)/.test(ua))
    return { name: 'Edge',    version: parseInt(RegExp.$1, 10) };

  // Chrome (exclude Opera which contains "OPR/")
  if (/Chrome\/(\d+)/.test(ua) && !/OPR\//.test(ua))
    return { name: 'Chrome',  version: parseInt(RegExp.$1, 10) };

  if (/Firefox\/(\d+)/.test(ua))
    return { name: 'Firefox', version: parseInt(RegExp.$1, 10) };

  // Safari — must exclude Chrome/Chromium which also include "Safari/" in their UA
  if (/Version\/(\d+).*Safari\//.test(ua) && !/Chrome\//.test(ua))
    return { name: 'Safari',  version: parseInt(RegExp.$1, 10) };

  return null; // Unknown / untested browser — allow through with a note
}

// ── Prerequisite checks ───────────────────────────────────────────────────────

interface CheckResult {
  webRtcSupported: boolean;
  secureContext: boolean;
  browser: BrowserInfo | null;
  browserSupported: boolean;
}

function runChecks(): CheckResult {
  const webRtcSupported =
    typeof RTCPeerConnection !== 'undefined' &&
    typeof navigator.mediaDevices !== 'undefined';

  // Secure Context: browsers unconditionally treat localhost/127.0.0.1 as
  // secure, so WebRTC works over plain HTTP in local dev.
  // Only warn if deployed to a non-localhost origin without HTTPS.
  const secureContext =
    window.isSecureContext === true ||
    location.hostname === 'localhost' ||
    location.hostname === '127.0.0.1' ||
    location.hostname === '[::1]';

  const browser = detectBrowser();
  const browserSupported =
    browser === null || browser.version >= (MIN_VERSIONS[browser.name] ?? 0);

  return { webRtcSupported, secureContext, browser, browserSupported };
}

// ── Components ────────────────────────────────────────────────────────────────

function BlockingError({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-md border border-red-200 p-8 text-center">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900 mb-2">{title}</h1>
        <p className="text-sm text-gray-500">{detail}</p>
        <p className="text-xs text-gray-400 mt-4">
          Supported browsers: Chrome 80+, Edge 80+, Firefox 75+, Safari 14+
        </p>
      </div>
    </div>
  );
}

interface WarningBannerProps {
  messages: string[];
  onDismiss: () => void;
}

function WarningBanner({ messages, onDismiss }: WarningBannerProps) {
  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-start gap-3">
      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-800">Browser compatibility warning</p>
        <ul className="mt-1 list-disc list-inside">
          {messages.map((m) => (
            <li key={m} className="text-xs text-amber-700">{m}</li>
          ))}
        </ul>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-amber-600 hover:text-amber-800 flex-shrink-0"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Public component ──────────────────────────────────────────────────────────

export function BrowserCheck({ children }: { children: ReactNode }) {
  const checks = runChecks();
  const [dismissed, setDismissed] = useState(false);

  // Hard block — WebRTC unavailable
  if (!checks.webRtcSupported) {
    return (
      <BlockingError
        title="WebRTC is not supported in this browser"
        detail="The Kaltura Avatar live video stream requires WebRTC. Please switch to Chrome 80+, Edge 80+, Firefox 75+, or Safari 14+ and reload."
      />
    );
  }

  // Collect soft warnings
  const warnings: string[] = [];
  if (!checks.secureContext) {
    warnings.push(
      'WebRTC requires a secure context (HTTPS). The avatar stream may not work over plain HTTP.',
    );
  }
  if (checks.browser && !checks.browserSupported) {
    warnings.push(
      `${checks.browser.name} ${checks.browser.version} is below the minimum supported version ` +
      `(${MIN_VERSIONS[checks.browser.name] ?? '?'}+). Please upgrade for the best experience.`,
    );
  }
  if (checks.browser === null) {
    warnings.push(
      'Unrecognised browser. For the best experience use Chrome 80+, Edge 80+, Firefox 75+, or Safari 14+.',
    );
  }

  return (
    <>
      {warnings.length > 0 && !dismissed && (
        <WarningBanner messages={warnings} onDismiss={() => setDismissed(true)} />
      )}
      {children}
    </>
  );
}

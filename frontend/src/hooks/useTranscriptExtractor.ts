import { useCallback, useEffect, useRef } from 'react';

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

const SYSTEM_PROMPT = `You are an insurance form assistant extracting claim data from a conversation.

RULES:
- Only extract information EXPLICITLY stated by the claimant. Never infer or assume.
- Dates must be formatted YYYY-MM-DD.
- Dollar amounts: extract numbers only, no $ symbol (e.g. "250" not "$250").
- For referral (boolean field): "yes" → "true", "no" → "false".
- Return ONLY fields that were clearly provided. If nothing was stated, return empty updates array.

AVAILABLE FIELDS (use these exact paths):
  /policyholder/fullName          Policyholder's full name
  /policyholder/dateOfBirth       Date of birth (YYYY-MM-DD)
  /policyholder/policyNumber      Insurance policy number
  /policyholder/memberId          Member ID on insurance card
  /policyholder/insuranceProvider Name of insurance company
  /claim/type                     Claim type (medical/dental/vision/prescription/mental_health)
  /claim/serviceDate              Date of service or treatment (YYYY-MM-DD)
  /claim/providerName             Doctor, clinic, or facility name
  /claim/providerLocation         Provider address or location
  /claim/diagnosis                Diagnosis or medical condition
  /claim/treatmentDescription     Treatment or procedure description
  /claim/referralObtained         Whether a referral was obtained (true/false)
  /claim/preAuthNumber            Pre-authorisation number (or "N/A" if none)
  /claim/amountBilled             Total amount billed in dollars (number only)
  /claim/amountPaidByPatient      Amount paid out of pocket (number only)
  /claim/amountClaimed            Amount being claimed from insurance (number only)
  /claim/additionalNotes          Any additional notes for the claims team`;

const RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    updates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          path:  { type: 'string' },
          value: { type: 'string' },
        },
        required: ['path', 'value'],
      },
    },
  },
  required: ['updates'],
};

/**
 * useTranscriptExtractor
 *
 * Listens to `user-transcription` postMessage events from the eself small-agent
 * widget, accumulates a rolling transcript, then calls Gemini directly from the
 * browser 500ms after the patient stops speaking.
 *
 * On each successful extraction, calls `onFieldUpdate(path, value)` for every
 * field Gemini identified — which maps directly to the A2UI data model.
 */
export function useTranscriptExtractor(
  onFieldUpdate: (path: string, value: unknown) => void,
) {
  const linesRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const busyRef  = useRef(false);

  const extractNow = useCallback(async () => {
    if (busyRef.current || linesRef.current.length === 0) return;

    const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
    if (!apiKey) {
      console.warn('[extractor] VITE_GOOGLE_API_KEY not set — skipping extraction');
      return;
    }

    busyRef.current = true;
    const transcript = linesRef.current.join('\n');

    try {
      const prompt = `${SYSTEM_PROMPT}\n\nConversation transcript:\n${transcript}\n\nExtract any claim fields clearly stated:`;

      const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0,
          },
        }),
      });

      if (!res.ok) return;

      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return;

      const { updates } = JSON.parse(text) as { updates: { path: string; value: string }[] };

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

      const raw = event.data?.data;
      const text: string =
        (typeof raw === 'string' ? raw : raw?.text ?? raw?.transcript ?? '') as string;

      if (!text.trim()) return;

      linesRef.current.push(`Patient: ${text.trim()}`);
      if (linesRef.current.length > 20) linesRef.current.shift();

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

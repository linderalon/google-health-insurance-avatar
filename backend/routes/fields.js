/**
 * POST /api/agent/fields/extract
 *
 * Extracts insurance claim form field values from a conversation transcript
 * using Gemini structured output. Returns [{path, value}] pairs for updateField().
 */

import { Router } from 'express';
const router = Router();

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

router.post('/extract', async (req, res, next) => {
  try {
    const { transcript } = req.body;
    if (!transcript?.trim()) return res.json({ updates: [] });

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) return res.json({ updates: [] });

    const prompt =
      `${SYSTEM_PROMPT}\n\nConversation transcript:\n${transcript}\n\nExtract any claim fields clearly stated:`;

    const geminiRes = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
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

    const data = await geminiRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.json({ updates: [] });

    const result = JSON.parse(text);
    if (result.updates?.length) {
      console.log('[fields] extracted:', result.updates.map(u => `${u.path}="${u.value}"`).join(', '));
    }
    return res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;

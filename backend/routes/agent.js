/**
 * Agent routes — streams the insurance claim form as pre-defined A2UI v0.8 JSONL.
 *
 * Using a deterministic pre-defined form (not LLM-generated) guarantees the
 * field IDs and data-model paths are always correct, which is required for the
 * transcript → field-extraction pipeline to work reliably.
 *
 * The form still streams progressively in 4 waves so the UI builds live.
 */

import { Router } from 'express';
const router = Router();

const SURFACE = 'insurance-claim-form';

// ── Pre-defined A2UI messages — 4 waves + data model ─────────────────────────

const FORM_WAVES = [
  // ── Wave 1: root structure + section headers → beginRendering ──────────────
  {
    surfaceUpdate: {
      surfaceId: SURFACE,
      components: [
        { id: 'root', component: { Column: { children: { explicitList: [
          'form-title',
          'policyholder-header',
          'fullname-field', 'dob-field', 'policy-number-field', 'member-id-field', 'insurance-provider-field',
          'claim-header',
          'claim-type-field', 'service-date-field', 'provider-name-field', 'provider-location-field',
          'treatment-header',
          'diagnosis-field', 'treatment-field', 'referral-checkbox', 'preauth-field',
          'amounts-header',
          'amount-billed-field', 'amount-paid-field', 'amount-claimed-field',
          'notes-field',
          'declaration-checkbox',
          'actions-row', 'cancel-btn-label', 'submit-btn-label', 'cancel-btn', 'submit-btn',
        ]}}}},
        { id: 'form-title',          component: { Text: { text: { literalString: 'Healthcare Insurance Claim' }, usageHint: 'h1' }}},
        { id: 'policyholder-header', component: { Text: { text: { literalString: 'Policyholder Information' }, usageHint: 'h2' }}},
        { id: 'claim-header',        component: { Text: { text: { literalString: 'Claim Details' }, usageHint: 'h2' }}},
        { id: 'treatment-header',    component: { Text: { text: { literalString: 'Treatment & Diagnosis' }, usageHint: 'h2' }}},
        { id: 'amounts-header',      component: { Text: { text: { literalString: 'Claim Amount' }, usageHint: 'h2' }}},
      ],
    },
  },
  { beginRendering: { surfaceId: SURFACE, root: 'root' } },

  // ── Wave 2: policyholder fields ────────────────────────────────────────────
  {
    surfaceUpdate: {
      surfaceId: SURFACE,
      components: [
        { id: 'fullname-field',           component: { TextField:     { label: { literalString: 'Policyholder Full Name' },        text: { path: '/policyholder/fullName' },        textFieldType: 'shortText' }}},
        { id: 'dob-field',                component: { DateTimeInput: { label: { literalString: 'Date of Birth' },                 value: { path: '/policyholder/dateOfBirth' },    enableDate: true, enableTime: false }}},
        { id: 'policy-number-field',      component: { TextField:     { label: { literalString: 'Policy Number' },                text: { path: '/policyholder/policyNumber' },   textFieldType: 'shortText' }}},
        { id: 'member-id-field',          component: { TextField:     { label: { literalString: 'Member ID' },                    text: { path: '/policyholder/memberId' },        textFieldType: 'shortText' }}},
        { id: 'insurance-provider-field', component: { TextField:     { label: { literalString: 'Insurance Provider' },           text: { path: '/policyholder/insuranceProvider'},textFieldType: 'shortText' }}},
      ],
    },
  },

  // ── Wave 3: claim details ──────────────────────────────────────────────────
  {
    surfaceUpdate: {
      surfaceId: SURFACE,
      components: [
        { id: 'claim-type-field', component: { MultipleChoice: {
          options: [
            { label: { literalString: 'Medical' },       value: 'medical' },
            { label: { literalString: 'Dental' },        value: 'dental' },
            { label: { literalString: 'Vision' },        value: 'vision' },
            { label: { literalString: 'Prescription' },  value: 'prescription' },
            { label: { literalString: 'Mental Health' }, value: 'mental_health' },
          ],
          selections: { path: '/claim/type' },
          maxAllowedSelections: 1,
        }}},
        { id: 'service-date-field',    component: { DateTimeInput: { label: { literalString: 'Date of Service' },             value: { path: '/claim/serviceDate' },      enableDate: true,  enableTime: false }}},
        { id: 'provider-name-field',   component: { TextField:     { label: { literalString: 'Provider / Facility Name' },   text:  { path: '/claim/providerName' },      textFieldType: 'shortText' }}},
        { id: 'provider-location-field', component: { TextField:   { label: { literalString: 'Provider Location / Address' },text:  { path: '/claim/providerLocation' },   textFieldType: 'shortText' }}},
      ],
    },
  },

  // ── Wave 4: treatment + amounts + declaration + submit ─────────────────────
  {
    surfaceUpdate: {
      surfaceId: SURFACE,
      components: [
        { id: 'diagnosis-field',   component: { TextField: { label: { literalString: 'Diagnosis / Condition' },           text: { path: '/claim/diagnosis' },           textFieldType: 'longText' }}},
        { id: 'treatment-field',   component: { TextField: { label: { literalString: 'Treatment / Procedure' },          text: { path: '/claim/treatmentDescription' }, textFieldType: 'longText' }}},
        { id: 'referral-checkbox', component: { CheckBox:  { label: { literalString: 'A referral was obtained' },        value: { path: '/claim/referralObtained' }}}},
        { id: 'preauth-field',     component: { TextField: { label: { literalString: 'Pre-Authorisation Number (if any)'},text: { path: '/claim/preAuthNumber' },        textFieldType: 'shortText' }}},
        { id: 'amount-billed-field', component: { TextField: { label: { literalString: 'Total Amount Billed ($)' },      text: { path: '/claim/amountBilled' },         textFieldType: 'number' }}},
        { id: 'amount-paid-field',   component: { TextField: { label: { literalString: 'Amount Paid by Patient ($)' },   text: { path: '/claim/amountPaidByPatient' },  textFieldType: 'number' }}},
        { id: 'amount-claimed-field',component: { TextField: { label: { literalString: 'Amount Being Claimed ($)' },     text: { path: '/claim/amountClaimed' },        textFieldType: 'number' }}},
        { id: 'notes-field',         component: { TextField: { label: { literalString: 'Additional Notes' },             text: { path: '/claim/additionalNotes' },      textFieldType: 'longText' }}},
        { id: 'declaration-checkbox',component: { CheckBox:  { label: { literalString: 'I declare that the information provided is accurate and complete to the best of my knowledge' }, value: { path: '/declaration/confirmed' }}}},
        { id: 'actions-row',       component: { Row: { children: { explicitList: ['cancel-btn', 'submit-btn'] }, distribution: 'spaceBetween' }}},
        { id: 'cancel-btn-label',  component: { Text: { text: { literalString: 'Cancel' }}}},
        { id: 'submit-btn-label',  component: { Text: { text: { literalString: 'Submit Claim' }}}},
        { id: 'cancel-btn', component: { Button: { child: 'cancel-btn-label', action: { name: 'cancel_claim' }}}},
        { id: 'submit-btn', component: { Button: { child: 'submit-btn-label', primary: true, action: {
          name: 'submit_claim',
          context: [
            { key: 'policyholder', value: { path: '/policyholder' } },
            { key: 'claim',        value: { path: '/claim' } },
            { key: 'declared',     value: { path: '/declaration/confirmed' } },
          ],
        }}}},
      ],
    },
  },

  // ── Data model: initialise all paths ──────────────────────────────────────
  {
    dataModelUpdate: {
      surfaceId: SURFACE,
      contents: [
        { key: 'policyholder', valueMap: [
          { key: 'fullName',           valueString: '' },
          { key: 'dateOfBirth',        valueString: '' },
          { key: 'policyNumber',       valueString: '' },
          { key: 'memberId',           valueString: '' },
          { key: 'insuranceProvider',  valueString: '' },
        ]},
        { key: 'claim', valueMap: [
          { key: 'type',                valueMap: [] },
          { key: 'serviceDate',         valueString: '' },
          { key: 'providerName',        valueString: '' },
          { key: 'providerLocation',    valueString: '' },
          { key: 'diagnosis',           valueString: '' },
          { key: 'treatmentDescription',valueString: '' },
          { key: 'referralObtained',    valueBoolean: false },
          { key: 'preAuthNumber',       valueString: '' },
          { key: 'amountBilled',        valueString: '' },
          { key: 'amountPaidByPatient', valueString: '' },
          { key: 'amountClaimed',       valueString: '' },
          { key: 'additionalNotes',     valueString: '' },
        ]},
        { key: 'declaration', valueMap: [
          { key: 'confirmed', valueBoolean: false },
        ]},
      ],
    },
  },
];

// ── SSE helper ────────────────────────────────────────────────────────────────

function sseWrite(res, event, data) {
  res.write(`event: ${event}\ndata: ${data}\n\n`);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Route ─────────────────────────────────────────────────────────────────────

/**
 * POST /api/agent/discharge-form/stream
 *
 * Streams the insurance claim form as SSE events with realistic wave delays
 * so the UI builds progressively in the browser.
 */
router.post('/discharge-form/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('X-Accel-Buffering', 'no');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  req.on('close', () => {});

  try {
    // Wave timings (ms) — feel natural, not instant
    const WAVE_DELAYS = [0, 50, 600, 1000, 1500, 2200];

    for (let i = 0; i < FORM_WAVES.length; i++) {
      await delay(WAVE_DELAYS[i] ?? 800);
      sseWrite(res, 'a2ui', JSON.stringify(FORM_WAVES[i]));
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      console.error('[agent] Stream error:', err.message);
      sseWrite(res, 'error', err.message);
    }
  }

  sseWrite(res, 'done', 'complete');
  res.end();
});

export default router;

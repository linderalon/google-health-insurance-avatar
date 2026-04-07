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

// ── Pre-defined form waves (mirrors backend/routes/agent.js) ──────────────────

const SURFACE = 'insurance-claim-form';

const FORM_WAVES: A2UIMessage[] = [
  // Wave 1: root structure + section headers
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

  // Wave 2: policyholder fields
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

  // Wave 3: claim details
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
        { id: 'service-date-field',      component: { DateTimeInput: { label: { literalString: 'Date of Service' },             value: { path: '/claim/serviceDate' },      enableDate: true,  enableTime: false }}},
        { id: 'provider-name-field',     component: { TextField:     { label: { literalString: 'Provider / Facility Name' },   text:  { path: '/claim/providerName' },      textFieldType: 'shortText' }}},
        { id: 'provider-location-field', component: { TextField:     { label: { literalString: 'Provider Location / Address' },text:  { path: '/claim/providerLocation' },   textFieldType: 'shortText' }}},
      ],
    },
  },

  // Wave 4: treatment + amounts + declaration + submit
  {
    surfaceUpdate: {
      surfaceId: SURFACE,
      components: [
        { id: 'diagnosis-field',     component: { TextField: { label: { literalString: 'Diagnosis / Condition' },            text: { path: '/claim/diagnosis' },            textFieldType: 'longText' }}},
        { id: 'treatment-field',     component: { TextField: { label: { literalString: 'Treatment / Procedure' },           text: { path: '/claim/treatmentDescription' },  textFieldType: 'longText' }}},
        { id: 'referral-checkbox',   component: { CheckBox:  { label: { literalString: 'A referral was obtained' },         value: { path: '/claim/referralObtained' }}}},
        { id: 'preauth-field',       component: { TextField: { label: { literalString: 'Pre-Authorisation Number (if any)'},text: { path: '/claim/preAuthNumber' },          textFieldType: 'shortText' }}},
        { id: 'amount-billed-field', component: { TextField: { label: { literalString: 'Total Amount Billed ($)' },         text: { path: '/claim/amountBilled' },           textFieldType: 'number' }}},
        { id: 'amount-paid-field',   component: { TextField: { label: { literalString: 'Amount Paid by Patient ($)' },      text: { path: '/claim/amountPaidByPatient' },    textFieldType: 'number' }}},
        { id: 'amount-claimed-field',component: { TextField: { label: { literalString: 'Amount Being Claimed ($)' },        text: { path: '/claim/amountClaimed' },          textFieldType: 'number' }}},
        { id: 'notes-field',         component: { TextField: { label: { literalString: 'Additional Notes' },                text: { path: '/claim/additionalNotes' },        textFieldType: 'longText' }}},
        { id: 'declaration-checkbox',component: { CheckBox:  { label: { literalString: 'I declare that the information provided is accurate and complete to the best of my knowledge' }, value: { path: '/declaration/confirmed' }}}},
        { id: 'actions-row',         component: { Row: { children: { explicitList: ['cancel-btn', 'submit-btn'] }, distribution: 'spaceBetween' }}},
        { id: 'cancel-btn-label',    component: { Text: { text: { literalString: 'Cancel' }}}},
        { id: 'submit-btn-label',    component: { Text: { text: { literalString: 'Submit Claim' }}}},
        { id: 'cancel-btn',  component: { Button: { child: 'cancel-btn-label', action: { name: 'cancel_claim' }}}},
        { id: 'submit-btn',  component: { Button: { child: 'submit-btn-label', primary: true, action: {
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

  // Data model: initialise all paths
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

const WAVE_DELAYS = [0, 50, 600, 1000, 1500, 2200];

/**
 * useA2UIStream — replays the pre-defined form waves locally with realistic
 * timing so the UI builds progressively, with no backend required.
 * Fires `onSpeech` whenever a KalturaAvatarView component arrives.
 */
export function useA2UIStream(onSpeech: (text: string) => void) {
  const [state, setState] = useState<A2UIStreamState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);
  const onSpeechRef = useRef(onSpeech);
  onSpeechRef.current = onSpeech;

  const processMessage = useCallback((message: A2UIMessage) => {
    setState((prev) => {
      if ('surfaceUpdate' in message) {
        const next = new Map(prev.components);
        for (const comp of message.surfaceUpdate.components) {
          next.set(comp.id, comp);

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
      for (let i = 0; i < FORM_WAVES.length; i++) {
        if (controller.signal.aborted) break;
        await new Promise<void>((resolve) => setTimeout(resolve, WAVE_DELAYS[i] ?? 800));
        if (controller.signal.aborted) break;
        processMessage(FORM_WAVES[i]);
      }

      if (!controller.signal.aborted) {
        setState((p) => ({ ...p, status: 'complete' }));
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

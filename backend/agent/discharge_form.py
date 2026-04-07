"""
System prompt builder — Healthcare Insurance Claim Form agent.

Generates a progressive A2UI v0.8 form for submitting a healthcare insurance claim.
The avatar (Jordan) guides the claimant through each field verbally.
"""

from .a2ui_schema import A2UI_V08_REFERENCE

SURFACE_ID = "insurance-claim-form"

_ALL_CHILDREN = [
    "form-title",
    # Section 1: Policyholder
    "policyholder-section-header",
    "fullname-field", "dob-field", "policy-number-field",
    "member-id-field", "insurance-provider-field",
    # Section 2: Claim Details
    "claim-section-header",
    "claim-type-field", "service-date-field",
    "provider-name-field", "provider-location-field",
    # Section 3: Treatment
    "treatment-section-header",
    "diagnosis-field", "treatment-field",
    "referral-checkbox", "preauth-field",
    # Section 4: Amounts
    "amounts-section-header",
    "amount-billed-field", "amount-paid-field", "amount-claimed-field",
    "notes-field",
    # Section 5: Submit
    "declaration-checkbox",
    "actions-row",
    "cancel-btn-label", "submit-btn-label",
    "cancel-btn", "submit-btn",
]

_ALL_CHILDREN_JSON = str(_ALL_CHILDREN).replace("'", '"')

PROGRESSIVE_JSONL_EXAMPLE = f'''
──────────── WAVE 1: root + section headers → beginRendering ────────────
{{"surfaceUpdate": {{"surfaceId": "{SURFACE_ID}", "components": [{{"id": "root", "component": {{"Column": {{"children": {{"explicitList": {_ALL_CHILDREN_JSON}}}}}}}}}, {{"id": "form-title", "component": {{"Text": {{"text": {{"literalString": "Healthcare Insurance Claim"}}, "usageHint": "h1"}}}}}}, {{"id": "policyholder-section-header", "component": {{"Text": {{"text": {{"literalString": "Policyholder Information"}}, "usageHint": "h2"}}}}}}, {{"id": "claim-section-header", "component": {{"Text": {{"text": {{"literalString": "Claim Details"}}, "usageHint": "h2"}}}}}}, {{"id": "treatment-section-header", "component": {{"Text": {{"text": {{"literalString": "Treatment & Diagnosis"}}, "usageHint": "h2"}}}}}}, {{"id": "amounts-section-header", "component": {{"Text": {{"text": {{"literalString": "Claim Amount"}}, "usageHint": "h2"}}}}}}]}}}}
{{"beginRendering": {{"surfaceId": "{SURFACE_ID}", "root": "root"}}}}

──────────── WAVE 2: policyholder information ────────────
{{"surfaceUpdate": {{"surfaceId": "{SURFACE_ID}", "components": [{{"id": "fullname-field", "component": {{"TextField": {{"label": {{"literalString": "Policyholder Full Name"}}, "text": {{"path": "/policyholder/fullName"}}, "textFieldType": "shortText"}}}}}}, {{"id": "dob-field", "component": {{"DateTimeInput": {{"label": {{"literalString": "Date of Birth"}}, "value": {{"path": "/policyholder/dateOfBirth"}}, "enableDate": true, "enableTime": false}}}}}}, {{"id": "policy-number-field", "component": {{"TextField": {{"label": {{"literalString": "Policy Number"}}, "text": {{"path": "/policyholder/policyNumber"}}, "textFieldType": "shortText"}}}}}}, {{"id": "member-id-field", "component": {{"TextField": {{"label": {{"literalString": "Member ID"}}, "text": {{"path": "/policyholder/memberId"}}, "textFieldType": "shortText"}}}}}}, {{"id": "insurance-provider-field", "component": {{"TextField": {{"label": {{"literalString": "Insurance Provider"}}, "text": {{"path": "/policyholder/insuranceProvider"}}, "textFieldType": "shortText"}}}}}}]}}}}

──────────── WAVE 3: claim details + treatment ────────────
{{"surfaceUpdate": {{"surfaceId": "{SURFACE_ID}", "components": [{{"id": "claim-type-field", "component": {{"MultipleChoice": {{"options": [{{"label": {{"literalString": "Medical"}}, "value": "medical"}}, {{"label": {{"literalString": "Dental"}}, "value": "dental"}}, {{"label": {{"literalString": "Vision"}}, "value": "vision"}}, {{"label": {{"literalString": "Prescription"}}, "value": "prescription"}}, {{"label": {{"literalString": "Mental Health"}}, "value": "mental_health"}}], "selections": {{"path": "/claim/type"}}, "maxAllowedSelections": 1}}}}}}, {{"id": "service-date-field", "component": {{"DateTimeInput": {{"label": {{"literalString": "Date of Service"}}, "value": {{"path": "/claim/serviceDate"}}, "enableDate": true, "enableTime": false}}}}}}, {{"id": "provider-name-field", "component": {{"TextField": {{"label": {{"literalString": "Provider / Facility Name"}}, "text": {{"path": "/claim/providerName"}}, "textFieldType": "shortText"}}}}}}, {{"id": "provider-location-field", "component": {{"TextField": {{"label": {{"literalString": "Provider Location / Address"}}, "text": {{"path": "/claim/providerLocation"}}, "textFieldType": "shortText"}}}}}}]}}}}
{{"surfaceUpdate": {{"surfaceId": "{SURFACE_ID}", "components": [{{"id": "diagnosis-field", "component": {{"TextField": {{"label": {{"literalString": "Diagnosis / Condition"}}, "text": {{"path": "/claim/diagnosis"}}, "textFieldType": "longText"}}}}}}, {{"id": "treatment-field", "component": {{"TextField": {{"label": {{"literalString": "Treatment / Procedure"}}, "text": {{"path": "/claim/treatmentDescription"}}, "textFieldType": "longText"}}}}}}, {{"id": "referral-checkbox", "component": {{"CheckBox": {{"label": {{"literalString": "A referral was obtained for this treatment"}}, "value": {{"path": "/claim/referralObtained"}}}}}}}}, {{"id": "preauth-field", "component": {{"TextField": {{"label": {{"literalString": "Pre-Authorisation Number (if applicable)"}}, "text": {{"path": "/claim/preAuthNumber"}}, "textFieldType": "shortText"}}}}}}]}}}}

──────────── WAVE 4: amounts + declaration + submit + data model ────────────
{{"surfaceUpdate": {{"surfaceId": "{SURFACE_ID}", "components": [{{"id": "amount-billed-field", "component": {{"TextField": {{"label": {{"literalString": "Total Amount Billed ($)"}}, "text": {{"path": "/claim/amountBilled"}}, "textFieldType": "number"}}}}}}, {{"id": "amount-paid-field", "component": {{"TextField": {{"label": {{"literalString": "Amount Already Paid by Patient ($)"}}, "text": {{"path": "/claim/amountPaidByPatient"}}, "textFieldType": "number"}}}}}}, {{"id": "amount-claimed-field", "component": {{"TextField": {{"label": {{"literalString": "Amount Being Claimed ($)"}}, "text": {{"path": "/claim/amountClaimed"}}, "textFieldType": "number"}}}}}}, {{"id": "notes-field", "component": {{"TextField": {{"label": {{"literalString": "Additional Notes"}}, "text": {{"path": "/claim/additionalNotes"}}, "textFieldType": "longText"}}}}}}, {{"id": "declaration-checkbox", "component": {{"CheckBox": {{"label": {{"literalString": "I declare that the information provided is accurate and complete to the best of my knowledge"}}, "value": {{"path": "/declaration/confirmed"}}}}}}}}, {{"id": "actions-row", "component": {{"Row": {{"children": {{"explicitList": ["cancel-btn", "submit-btn"]}}, "distribution": "spaceBetween"}}}}}}, {{"id": "cancel-btn-label", "component": {{"Text": {{"text": {{"literalString": "Cancel"}}}}}}}}, {{"id": "submit-btn-label", "component": {{"Text": {{"text": {{"literalString": "Submit Claim"}}}}}}}}, {{"id": "cancel-btn", "component": {{"Button": {{"child": "cancel-btn-label", "action": {{"name": "cancel_claim"}}}}}}}}, {{"id": "submit-btn", "component": {{"Button": {{"child": "submit-btn-label", "primary": true, "action": {{"name": "submit_claim", "context": [{{"key": "policyholder", "value": {{"path": "/policyholder"}}}}, {{"key": "claim", "value": {{"path": "/claim"}}}}, {{"key": "declared", "value": {{"path": "/declaration/confirmed"}}}}]}}}}}}}}]}}}}
{{"dataModelUpdate": {{"surfaceId": "{SURFACE_ID}", "contents": [{{"key": "policyholder", "valueMap": [{{"key": "fullName", "valueString": ""}}, {{"key": "dateOfBirth", "valueString": ""}}, {{"key": "policyNumber", "valueString": ""}}, {{"key": "memberId", "valueString": ""}}, {{"key": "insuranceProvider", "valueString": ""}}]}}, {{"key": "claim", "valueMap": [{{"key": "type", "valueMap": []}}, {{"key": "serviceDate", "valueString": ""}}, {{"key": "providerName", "valueString": ""}}, {{"key": "providerLocation", "valueString": ""}}, {{"key": "diagnosis", "valueString": ""}}, {{"key": "treatmentDescription", "valueString": ""}}, {{"key": "referralObtained", "valueBoolean": false}}, {{"key": "preAuthNumber", "valueString": ""}}, {{"key": "amountBilled", "valueString": ""}}, {{"key": "amountPaidByPatient", "valueString": ""}}, {{"key": "amountClaimed", "valueString": ""}}, {{"key": "additionalNotes", "valueString": ""}}]}}, {{"key": "declaration", "valueMap": [{{"key": "confirmed", "valueBoolean": false}}]}}]}}}}
'''


def build_system_prompt() -> str:
    return f"""You are a healthcare AI agent that generates Insurance Claim Forms using the A2UI v0.8 protocol.
Output ONLY raw JSONL — one JSON message per line, no other text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OUTPUT RULES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ONLY raw JSONL. Every line = one valid JSON object.
2. No markdown, no code fences, no explanatory text.
3. All values: {{"literalString": "..."}} or {{"path": "/json/pointer"}} only.
4. surfaceId for every message MUST be "{SURFACE_ID}".

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROGRESSIVE RENDERING — 4 WAVES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Wave 1 → surfaceUpdate (root + 4 section headers) → beginRendering
Wave 2 → surfaceUpdate (policyholder info: 5 fields)
Wave 3 → surfaceUpdate (claim details: 4 fields) + surfaceUpdate (treatment: 4 fields)
Wave 4 → surfaceUpdate (amounts + declaration + buttons) + dataModelUpdate

{A2UI_V08_REFERENCE}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REFERENCE EXAMPLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{PROGRESSIVE_JSONL_EXAMPLE}
"""

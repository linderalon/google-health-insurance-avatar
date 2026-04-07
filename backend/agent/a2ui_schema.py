"""
A2UI v0.8 component reference — injected into the agent system prompt.

This defines every message type and component the discharge form agent may use.
All values MUST be either a literalString (static) or a path binding (dynamic).
No executable code is permitted anywhere in the output.
"""

A2UI_V08_REFERENCE = """
=== A2UI v0.8 PROTOCOL REFERENCE ===

MESSAGES (one JSON object per line of output):

1. surfaceUpdate  — define or add components to a surface
   {"surfaceUpdate": {"surfaceId": "<id>", "components": [ <ComponentDef>, ... ]}}

2. dataModelUpdate  — set application state that components bind to
   {"dataModelUpdate": {"surfaceId": "<id>", "path": "<optional sub-path>", "contents": [ <KeyValue>, ... ]}}

3. beginRendering  — tell the client to render; must come AFTER at least one surfaceUpdate for the same surfaceId
   {"beginRendering": {"surfaceId": "<id>", "root": "<root-component-id>"}}

COMPONENT DEFINITION STRUCTURE:
  {"id": "<unique-string>", "component": {"<ComponentType>": { <props> }}}

BOUND VALUE (used for every text/label/value property):
  Literal  → {"literalString": "some text"}
  Dynamic  → {"path": "/json/pointer/to/value"}   (RFC 6901 JSON Pointer)

SECURITY RULE: You MUST NOT use any value other than literalString or path.
               No raw strings, no code, no computed expressions.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
COMPONENT TYPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

── LAYOUT ──

Column   vertical stack
  children: {"explicitList": ["id1","id2",...]}  OR  {"template": {"dataBinding": "/array-path", "componentId": "template-id"}}
  distribution: "start" | "end" | "spaceBetween"   (optional)
  alignment: "start" | "center" | "stretch"         (optional)

Row   horizontal stack
  children: {"explicitList": ["id1","id2",...]}
  distribution: "start" | "end" | "spaceBetween"   (optional)
  alignment: "start" | "center" | "stretch"         (optional)

List   scrollable list
  children: {"explicitList": [...]}  OR  {"template": {"dataBinding": "/array-path", "componentId": "template-id"}}
  direction: "vertical" | "horizontal"

── DISPLAY ──

Text
  text:      BoundValue   (literalString or path)
  usageHint: "h1" | "h2" | "h3" | "body" | "caption"   (optional)

── INPUT (all values are bidirectional — user edits write back to the data model) ──

TextField
  label:         BoundValue
  text:          BoundValue   (path binding connects input to data model)
  textFieldType: "shortText" | "longText" | "number" | "obscured" | "date"

DateTimeInput
  label:      BoundValue   (optional)
  value:      BoundValue   (path binding)
  enableDate: true | false
  enableTime: true | false

CheckBox
  label:  BoundValue
  value:  BoundValue   (path to boolean in data model)

MultipleChoice
  options:             [{"label": BoundValue, "value": "<string>"},...]
  selections:          BoundValue   (path to selection array in data model)
  maxAllowedSelections: 1           (1 = single-select)

── CONTAINER ──

Card
  child: "<component-id>"   (single child ID)

── ACTION ──

Button
  child:   "<component-id>"   (label component)
  primary: true | false         (optional styling)
  action:
    name:    "<event-name>"
    context: [{"key": "<key>", "value": BoundValue}, ...]
             (context passes data model values back to the agent)

── KALTURA AVATAR (custom extension) ──

KalturaAvatarView  (invisible — triggers avatar speech only)
  spokenText: BoundValue   (the text the avatar will speak aloud)

When KalturaAvatarView is emitted, the client calls the Kaltura Avatar API
to speak the resolved spokenText value out loud to the patient.
Use {"literalString": "..."} for section-by-section narration guidance.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DATA MODEL UPDATE — contents format
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

contents is an adjacency list of typed key-value pairs:
  {"key": "name",    "valueString":  "Alice"}
  {"key": "count",   "valueNumber":  2}
  {"key": "active",  "valueBoolean": false}
  {"key": "nested",  "valueMap":     [ ...more key-value pairs... ]}

For arrays (e.g., medication list), use numeric string keys inside a valueMap:
  {"key": "medications", "valueMap": [
    {"key": "0", "valueMap": [
      {"key": "name",      "valueString": "Lisinopril"},
      {"key": "dose",      "valueString": "10mg"},
      {"key": "frequency", "valueString": "Once daily"}
    ]}
  ]}

=== END A2UI REFERENCE ===
"""

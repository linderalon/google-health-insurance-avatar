// ─── A2UI v0.8 TypeScript types ───────────────────────────────────────────────

export type BoundValue =
  | { literalString: string }
  | { path: string };

export type ChildrenDef =
  | { explicitList: string[] }
  | { template: { dataBinding: string; componentId: string } };

// ── Component props ───────────────────────────────────────────────────────────

export interface TextProps {
  text: BoundValue;
  usageHint?: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
}

export interface TextFieldProps {
  label: BoundValue;
  text: BoundValue;
  textFieldType: 'shortText' | 'longText' | 'number' | 'obscured' | 'date';
  validationRegexp?: string;
}

export interface DateTimeInputProps {
  label?: BoundValue;
  value: BoundValue;
  enableDate: boolean;
  enableTime: boolean;
}

export interface CheckBoxProps {
  label: BoundValue;
  value: BoundValue;
}

export interface MultipleChoiceOption {
  label: BoundValue;
  value: string;
}

export interface MultipleChoiceProps {
  options: MultipleChoiceOption[];
  selections: BoundValue;
  maxAllowedSelections: number;
}

export interface ColumnProps {
  children: ChildrenDef;
  distribution?: 'start' | 'end' | 'spaceBetween';
  alignment?: 'start' | 'center' | 'stretch';
}

export interface RowProps {
  children: ChildrenDef;
  distribution?: 'start' | 'end' | 'spaceBetween';
  alignment?: 'start' | 'center' | 'stretch';
}

export interface ListProps {
  children: ChildrenDef;
  direction: 'vertical' | 'horizontal';
}

export interface CardProps {
  child: string;
}

export interface ButtonActionContext {
  key: string;
  value: BoundValue;
}

export interface ButtonAction {
  name: string;
  context?: ButtonActionContext[];
}

export interface ButtonProps {
  child: string;
  primary?: boolean;
  action: ButtonAction;
}

/** Custom catalog extension — triggers Kaltura Avatar speech. No visual output. */
export interface KalturaAvatarViewProps {
  spokenText: BoundValue;
}

export type ComponentProps =
  | { Text: TextProps }
  | { TextField: TextFieldProps }
  | { DateTimeInput: DateTimeInputProps }
  | { CheckBox: CheckBoxProps }
  | { MultipleChoice: MultipleChoiceProps }
  | { Column: ColumnProps }
  | { Row: RowProps }
  | { List: ListProps }
  | { Card: CardProps }
  | { Button: ButtonProps }
  | { KalturaAvatarView: KalturaAvatarViewProps };

export interface A2UIComponent {
  id: string;
  component: ComponentProps;
}

// ── Data model ────────────────────────────────────────────────────────────────

export interface DataModelEntry {
  key: string;
  valueString?: string;
  valueNumber?: number;
  valueBoolean?: boolean;
  valueMap?: DataModelEntry[];
}

// ── Messages ──────────────────────────────────────────────────────────────────

export type A2UIMessage =
  | { surfaceUpdate: { surfaceId: string; components: A2UIComponent[] } }
  | { dataModelUpdate: { surfaceId: string; path?: string; contents: DataModelEntry[] } }
  | { beginRendering: { surfaceId: string; root: string } };

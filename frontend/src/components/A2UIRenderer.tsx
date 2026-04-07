/**
 * A2UIRenderer — A2UI v0.8 surface renderer styled with Google Material Design.
 *
 * All values come from declarative BoundValue objects only (literalString or path).
 * No eval, no dangerouslySetInnerHTML, no code execution.
 */

import { useId } from 'react';
import { resolveBound, resolveRawBound, getByPath } from '../lib/dataModel';
import type {
  A2UIComponent,
  BoundValue,
  ChildrenDef,
  ButtonAction,
  ButtonActionContext,
} from '../types/a2ui';

// ── Shared Google Material styles ─────────────────────────────────────────────

const G = {
  blue:      '#1a73e8',
  blueDark:  '#1557b0',
  blueLight: '#e8f0fe',
  text:      '#202124',
  text2:     '#5f6368',
  text3:     '#80868b',
  border:    '#dadce0',
  borderFocus: '#1a73e8',
  bg:        '#f8f9fa',
  error:     '#ea4335',
  green:     '#34a853',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  border: `1px solid ${G.border}`,
  borderRadius: 4,
  padding: '10px 12px',
  fontSize: 14,
  color: G.text,
  background: '#fff',
  outline: 'none',
  fontFamily: "'Google Sans', Roboto, sans-serif",
  transition: 'border-color 0.15s',
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface RendererProps {
  rootId: string;
  components: Map<string, A2UIComponent>;
  dataModel: Record<string, unknown>;
  onAction: (name: string, context: Record<string, unknown>) => void;
  onDataChange: (path: string, value: unknown) => void;
}

interface NodeProps {
  id: string;
  components: Map<string, A2UIComponent>;
  dataModel: Record<string, unknown>;
  scopeData?: Record<string, unknown>;
  onAction: (name: string, context: Record<string, unknown>) => void;
  onDataChange: (path: string, value: unknown) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function resolveActionContext(
  ctxDefs: ButtonActionContext[] | undefined,
  dataModel: Record<string, unknown>,
  scopeData?: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const { key, value } of ctxDefs ?? []) out[key] = resolveRawBound(value, dataModel, scopeData);
  return out;
}

// ── RenderNode ────────────────────────────────────────────────────────────────

function RenderNode({ id, components, dataModel, scopeData, onAction, onDataChange }: NodeProps) {
  const uid = useId();
  const comp = components.get(id);
  if (!comp) return null;

  const type = Object.keys(comp.component)[0];
  const props = (comp.component as unknown as Record<string, Record<string, unknown>>)[type];

  const childNode = (childId: string, scope?: Record<string, unknown>) => (
    <RenderNode key={childId} id={childId} components={components} dataModel={dataModel}
      scopeData={scope ?? scopeData} onAction={onAction} onDataChange={onDataChange} />
  );

  const renderChildren = (def: ChildrenDef, extraScope?: Record<string, unknown>) => {
    if ('explicitList' in def) return def.explicitList.map(cid => childNode(cid, extraScope));
    const { dataBinding, componentId } = def.template;
    const items = getByPath(dataModel, dataBinding);
    if (!Array.isArray(items)) return null;
    return items.map((item, i) => (
      <RenderNode key={`${componentId}-${i}`} id={componentId} components={components}
        dataModel={dataModel} scopeData={item as Record<string, unknown>}
        onAction={onAction} onDataChange={onDataChange} />
    ));
  };

  // ── Layout ──────────────────────────────────────────────────────────────────

  if (type === 'Column') {
    const { children } = props as { children: ChildrenDef };
    return <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>{renderChildren(children)}</div>;
  }

  if (type === 'Row') {
    const { children, distribution } = props as { children: ChildrenDef; distribution?: string };
    return (
      <div style={{
        display: 'flex', flexDirection: 'row', gap: 12, flexWrap: 'wrap',
        justifyContent: distribution === 'spaceBetween' ? 'space-between' : distribution === 'end' ? 'flex-end' : 'flex-start',
        alignItems: 'center',
      }}>
        {renderChildren(children)}
      </div>
    );
  }

  if (type === 'List') {
    const { children, direction } = props as { children: ChildrenDef; direction?: string };
    return (
      <div style={{ display: 'flex', flexDirection: direction === 'horizontal' ? 'row' : 'column', gap: 12, flexWrap: 'wrap' }}>
        {renderChildren(children)}
      </div>
    );
  }

  // ── Display ─────────────────────────────────────────────────────────────────

  if (type === 'Text') {
    const { text, usageHint } = props as { text: BoundValue; usageHint?: string };
    const content = resolveBound(text, dataModel, scopeData);
    const styles: Record<string, React.CSSProperties> = {
      h1:      { fontSize: 22, fontWeight: 400, color: G.text, margin: '8px 0 4px' },
      h2:      { fontSize: 15, fontWeight: 500, color: G.text, margin: '12px 0 0', paddingBottom: 8, borderBottom: `1px solid ${G.border}` },
      h3:      { fontSize: 14, fontWeight: 500, color: G.text },
      caption: { fontSize: 12, color: G.text3 },
      body:    { fontSize: 14, color: G.text2 },
    };
    const style = styles[usageHint ?? 'body'] ?? styles.body;
    return <p style={style}>{content}</p>;
  }

  // ── Input ───────────────────────────────────────────────────────────────────

  if (type === 'TextField') {
    const { label, text, textFieldType } = props as { label: BoundValue; text: BoundValue; textFieldType: string };
    const labelStr = resolveBound(label, dataModel, scopeData);
    const value    = resolveBound(text, dataModel, scopeData);
    const path     = 'path' in text ? text.path : null;
    const inputId  = `${uid}-${id}`;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <label htmlFor={inputId} style={{ fontSize: 12, fontWeight: 500, color: G.text2 }}>{labelStr}</label>
        {textFieldType === 'longText'
          ? <textarea id={inputId} rows={3} value={value}
              onChange={e => path && onDataChange(path, e.target.value)}
              style={{ ...inputBase, resize: 'vertical', lineHeight: 1.5 }}
              onFocus={e => (e.currentTarget.style.borderColor = G.borderFocus)}
              onBlur={e => (e.currentTarget.style.borderColor = G.border)} />
          : <input id={inputId}
              type={textFieldType === 'number' ? 'number' : textFieldType === 'obscured' ? 'password' : 'text'}
              value={value}
              onChange={e => path && onDataChange(path, e.target.value)}
              style={{ ...inputBase }}
              onFocus={e => (e.currentTarget.style.borderColor = G.borderFocus)}
              onBlur={e => (e.currentTarget.style.borderColor = G.border)} />
        }
      </div>
    );
  }

  if (type === 'DateTimeInput') {
    const { label, value: vBound, enableDate, enableTime } = props as {
      label?: BoundValue; value: BoundValue; enableDate: boolean; enableTime: boolean;
    };
    const labelStr = label ? resolveBound(label, dataModel, scopeData) : '';
    const value    = resolveBound(vBound, dataModel, scopeData);
    const path     = 'path' in vBound ? vBound.path : null;
    const inputId  = `${uid}-${id}`;
    const inputType = enableDate && enableTime ? 'datetime-local' : enableDate ? 'date' : 'time';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {labelStr && <label htmlFor={inputId} style={{ fontSize: 12, fontWeight: 500, color: G.text2 }}>{labelStr}</label>}
        <input id={inputId} type={inputType} value={value}
          onChange={e => path && onDataChange(path, e.target.value)}
          style={{ ...inputBase, maxWidth: 280 }}
          onFocus={e => (e.currentTarget.style.borderColor = G.borderFocus)}
          onBlur={e => (e.currentTarget.style.borderColor = G.border)} />
      </div>
    );
  }

  if (type === 'CheckBox') {
    const { label, value: vBound } = props as { label: BoundValue; value: BoundValue };
    const labelStr = resolveBound(label, dataModel, scopeData);
    const checked  = Boolean(resolveRawBound(vBound, dataModel, scopeData));
    const path     = 'path' in vBound ? vBound.path : null;
    const inputId  = `${uid}-${id}`;

    return (
      <label htmlFor={inputId} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
        <input id={inputId} type="checkbox" checked={checked}
          onChange={e => path && onDataChange(path, e.target.checked)}
          style={{ marginTop: 2, accentColor: G.blue, width: 16, height: 16, cursor: 'pointer' }} />
        <span style={{ fontSize: 13, color: G.text2, lineHeight: 1.5 }}>{labelStr}</span>
      </label>
    );
  }

  if (type === 'MultipleChoice') {
    const { options, selections: sBound, maxAllowedSelections } = props as {
      options: { label: BoundValue; value: string }[];
      selections: BoundValue;
      maxAllowedSelections: number;
    };
    const current = (resolveRawBound(sBound, dataModel, scopeData) as string[] | null) ?? [];
    const path    = 'path' in sBound ? sBound.path : null;
    const single  = maxAllowedSelections === 1;

    const toggle = (val: string) => {
      if (!path) return;
      onDataChange(path, single ? [val] : current.includes(val) ? current.filter(v => v !== val) : [...current, val]);
    };

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const sel = Array.isArray(current) && current.includes(opt.value);
          return (
            <button key={opt.value} type="button" onClick={() => toggle(opt.value)} style={{
              padding: '6px 14px', borderRadius: 16, fontSize: 13, fontWeight: 500,
              cursor: 'pointer', fontFamily: "'Google Sans', Roboto, sans-serif",
              border: sel ? `1px solid ${G.blue}` : `1px solid ${G.border}`,
              background: sel ? G.blueLight : '#fff',
              color: sel ? G.blue : G.text2,
              transition: 'all 0.15s',
            }}>
              {resolveBound(opt.label, dataModel, scopeData)}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Container ───────────────────────────────────────────────────────────────

  if (type === 'Card') {
    const { child } = props as { child: string };
    return (
      <div style={{ border: `1px solid ${G.border}`, borderRadius: 8, padding: '14px 16px', background: '#fff' }}>
        {childNode(child)}
      </div>
    );
  }

  // ── Action ──────────────────────────────────────────────────────────────────

  if (type === 'Button') {
    const { child, primary, action } = props as { child: string; primary?: boolean; action: ButtonAction };
    const ctx = resolveActionContext(action.context, dataModel, scopeData);

    if (primary) {
      return (
        <button type="button" onClick={() => onAction(action.name, ctx)} style={{
          background: G.blue, color: '#fff', border: 'none', borderRadius: 4,
          padding: '10px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
          fontFamily: "'Google Sans', Roboto, sans-serif", letterSpacing: '0.01em',
          boxShadow: '0 1px 2px rgba(60,64,67,.3)',
        }}
          onMouseOver={e => (e.currentTarget.style.background = G.blueDark)}
          onMouseOut={e => (e.currentTarget.style.background = G.blue)}>
          {childNode(child)}
        </button>
      );
    }
    return (
      <button type="button" onClick={() => onAction(action.name, ctx)} style={{
        background: '#fff', color: G.blue, border: `1px solid ${G.border}`, borderRadius: 4,
        padding: '9px 24px', fontSize: 14, fontWeight: 500, cursor: 'pointer',
        fontFamily: "'Google Sans', Roboto, sans-serif", letterSpacing: '0.01em',
      }}
        onMouseOver={e => { e.currentTarget.style.background = G.blueLight; e.currentTarget.style.borderColor = G.blue; }}
        onMouseOut={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = G.border; }}>
        {childNode(child)}
      </button>
    );
  }

  // ── KalturaAvatarView — invisible; speech handled in useA2UIStream ──────────
  if (type === 'KalturaAvatarView') return null;

  return null;
}

// ── Public component ──────────────────────────────────────────────────────────

export function A2UIRenderer({ rootId, components, dataModel, onAction, onDataChange }: RendererProps) {
  return (
    <RenderNode id={rootId} components={components} dataModel={dataModel}
      onAction={onAction} onDataChange={onDataChange} />
  );
}

import type { DataModelEntry } from '../types/a2ui';

// ─── JSON Pointer (RFC 6901) path helpers ─────────────────────────────────────

export function getByPath(model: unknown, path: string): unknown {
  if (!path || path === '/') return model;
  const parts = path.replace(/^\//, '').split('/').filter(Boolean);
  let current: unknown = model;
  for (const part of parts) {
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function setByPath(
  model: Record<string, unknown>,
  path: string,
  value: unknown,
): Record<string, unknown> {
  if (!path || path === '/') return value as Record<string, unknown>;
  const parts = path.replace(/^\//, '').split('/').filter(Boolean);
  const result = structuredClone(model) as Record<string, unknown>;
  let current: Record<string, unknown> = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    current[key] =
      current[key] !== null && typeof current[key] === 'object'
        ? structuredClone(current[key])
        : {};
    current = current[key] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
  return result;
}

// ─── v0.8 adjacency-list → plain JS object ───────────────────────────────────

function convertEntry(entry: DataModelEntry): unknown {
  if (entry.valueString !== undefined) return entry.valueString;
  if (entry.valueNumber !== undefined) return entry.valueNumber;
  if (entry.valueBoolean !== undefined) return entry.valueBoolean;
  if (entry.valueMap !== undefined) return convertAdjacencyList(entry.valueMap);
  return null;
}

function convertAdjacencyList(entries: DataModelEntry[]): unknown {
  if (entries.length === 0) return {};
  // Numeric string keys → JS array (e.g. medications: {"0":…, "1":…})
  const allNumeric = entries.every((e) => /^\d+$/.test(e.key));
  if (allNumeric) {
    const maxIdx = Math.max(...entries.map((e) => parseInt(e.key, 10)));
    const arr: unknown[] = new Array(maxIdx + 1).fill(null);
    for (const entry of entries) arr[parseInt(entry.key, 10)] = convertEntry(entry);
    return arr;
  }
  const obj: Record<string, unknown> = {};
  for (const entry of entries) obj[entry.key] = convertEntry(entry);
  return obj;
}

export function applyDataModelUpdate(
  model: Record<string, unknown>,
  path: string | undefined,
  contents: DataModelEntry[],
): Record<string, unknown> {
  const incoming = convertAdjacencyList(contents) as Record<string, unknown>;
  if (!path) return { ...model, ...incoming };
  const existing = (getByPath(model, `/${path}`) ?? {}) as Record<string, unknown>;
  return setByPath(model, `/${path}`, { ...existing, ...incoming });
}

// ─── BoundValue resolution ────────────────────────────────────────────────────

import type { BoundValue } from '../types/a2ui';

/**
 * Resolve a BoundValue to a string.
 * scopeData is set when rendering inside a List template — paths like /name
 * resolve against the current array item before falling back to the root model.
 */
export function resolveBound(
  value: BoundValue,
  dataModel: Record<string, unknown>,
  scopeData?: Record<string, unknown>,
): string {
  if ('literalString' in value) return value.literalString;
  const { path } = value;
  if (scopeData !== undefined) {
    const scoped = getByPath(scopeData, path);
    if (scoped !== undefined && scoped !== null) return String(scoped);
  }
  const val = getByPath(dataModel, path);
  return val !== undefined && val !== null ? String(val) : '';
}

export function resolveRawBound(
  value: BoundValue,
  dataModel: Record<string, unknown>,
  scopeData?: Record<string, unknown>,
): unknown {
  if ('literalString' in value) return value.literalString;
  const { path } = value;
  if (scopeData !== undefined) {
    const scoped = getByPath(scopeData, path);
    if (scoped !== undefined) return scoped;
  }
  return getByPath(dataModel, path);
}

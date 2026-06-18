export function clampStat(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function clampRelationship(value: number): number {
  return clampStat(value);
}

export function clampCash(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(value);
}

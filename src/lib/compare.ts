export const COMPARE_COOKIE = "mx_compare";
export const MAX_COMPARE = 3;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseCompare(raw: string | undefined | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const trimmed = part.trim();
    if (!UUID_RE.test(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
    if (out.length >= MAX_COMPARE) break;
  }
  return out;
}

export function serializeCompare(ids: string[]): string {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const id of ids) {
    if (!UUID_RE.test(id)) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
    if (out.length >= MAX_COMPARE) break;
  }
  return out.join(",");
}

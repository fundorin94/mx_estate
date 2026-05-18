export const SITE_NAME = "ExpHaven";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

export const SITE_DESCRIPTION =
  "Property search for US and Canadian expats in Mexico — verified realtors, clear legal info, English-first UX. Cabo, Puerto Vallarta, San Miguel de Allende.";

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

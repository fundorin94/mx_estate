"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  COMPARE_COOKIE,
  MAX_COMPARE,
  parseCompare,
  serializeCompare,
} from "@/lib/compare";

const COOKIE_OPTS = {
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
  sameSite: "lax" as const,
};

function revalidateAll() {
  revalidatePath("/properties");
  revalidatePath("/properties/[id]", "page");
  revalidatePath("/compare");
}

export async function toggleCompare(propertyId: string) {
  const store = cookies();
  const current = parseCompare(store.get(COMPARE_COOKIE)?.value);
  const next = current.includes(propertyId)
    ? current.filter((id) => id !== propertyId)
    : [...current, propertyId].slice(0, MAX_COMPARE);
  store.set(COMPARE_COOKIE, serializeCompare(next), COOKIE_OPTS);
  revalidateAll();
}

export async function clearCompare() {
  cookies().delete(COMPARE_COOKIE);
  revalidateAll();
}

export async function removeFromCompare(propertyId: string) {
  const store = cookies();
  const current = parseCompare(store.get(COMPARE_COOKIE)?.value);
  const next = current.filter((id) => id !== propertyId);
  store.set(COMPARE_COOKIE, serializeCompare(next), COOKIE_OPTS);
  revalidateAll();
}

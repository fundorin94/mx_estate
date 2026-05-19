"use server";

import { createClient } from "@/lib/supabase/server";
import { sendLeadNotification } from "@/lib/email";

export type LeadFormState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

const TIMELINES = new Set(["asap", "3mo", "6mo", "1yr"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getStr(fd: FormData, key: string) {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim() : "";
}

function getOptionalStr(fd: FormData, key: string) {
  const s = getStr(fd, key);
  return s.length === 0 ? null : s;
}

export async function submitLead(
  _prev: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  const propertyId = getStr(formData, "property_id");
  const realtorId = getOptionalStr(formData, "realtor_id");

  if (!UUID_RE.test(propertyId)) {
    return { status: "error", message: "Invalid property reference." };
  }
  if (realtorId !== null && !UUID_RE.test(realtorId)) {
    return { status: "error", message: "Invalid agent reference." };
  }

  const name = getStr(formData, "name");
  const email = getStr(formData, "email");
  const message = getStr(formData, "message");
  const phone = getOptionalStr(formData, "phone");
  const budgetRaw = getOptionalStr(formData, "budget_usd");
  const timelineRaw = getOptionalStr(formData, "timeline");

  const fieldErrors: Record<string, string> = {};
  if (!name) fieldErrors.name = "Please enter your name.";
  if (!email) fieldErrors.email = "Please enter your email.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fieldErrors.email = "Please enter a valid email address.";
  if (!message) fieldErrors.message = "Please add a short message.";

  let budget: number | null = null;
  if (budgetRaw !== null) {
    const n = Number.parseInt(budgetRaw, 10);
    if (!Number.isFinite(n) || n < 0) {
      fieldErrors.budget_usd = "Budget must be a positive number.";
    } else {
      budget = n;
    }
  }

  const timeline =
    timelineRaw !== null && TIMELINES.has(timelineRaw) ? timelineRaw : null;

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors,
    };
  }

  const supabase = createClient();
  const { error } = await supabase.from("leads").insert({
    property_id: propertyId,
    realtor_id: realtorId,
    name,
    email,
    phone,
    message,
    budget_usd: budget,
    timeline,
  });

  if (error) {
    return {
      status: "error",
      message: `Could not send your request: ${error.message}`,
    };
  }

  // Fire-and-log email notification. Lead is already saved; never fail user
  // flow on email errors.
  try {
    const { data: property } = await supabase
      .from("properties")
      .select("id, title, price_usd, type, neighborhood, city_id")
      .eq("id", propertyId)
      .maybeSingle();

    const [{ data: city }, { data: realtor }] = await Promise.all([
      property?.city_id
        ? supabase
            .from("cities")
            .select("name")
            .eq("id", property.city_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      realtorId
        ? supabase
            .from("realtors")
            .select("id, name, email, phone")
            .eq("id", realtorId)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (property) {
      await sendLeadNotification({
        buyer: {
          name,
          email,
          phone,
          message,
          budgetUsd: budget,
          timeline,
        },
        property: {
          id: property.id,
          title: property.title,
          priceUsd: property.price_usd,
          type: property.type,
          neighborhood: property.neighborhood,
          cityName: city?.name ?? null,
        },
        realtor: realtor
          ? {
              id: realtor.id,
              name: realtor.name,
              email: realtor.email,
              phone: realtor.phone,
            }
          : null,
      });
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[submitLead] notification failed:", e);
  }

  return { status: "success" };
}

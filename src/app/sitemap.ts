import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600; // refresh sitemap hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const [{ data: properties }, { data: realtors }] = await Promise.all([
    supabase
      .from("properties")
      .select("id, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("realtors")
      .select("id, created_at")
      .order("created_at", { ascending: false }),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    {
      url: `${SITE_URL}/properties`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/realtors`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  const propertyEntries: MetadataRoute.Sitemap = (properties ?? []).map((p) => ({
    url: `${SITE_URL}/properties/${p.id}`,
    lastModified: p.created_at ? new Date(p.created_at) : now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const realtorEntries: MetadataRoute.Sitemap = (realtors ?? []).map((r) => ({
    url: `${SITE_URL}/realtors/${r.id}`,
    lastModified: r.created_at ? new Date(r.created_at) : now,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [...staticEntries, ...propertyEntries, ...realtorEntries];
}

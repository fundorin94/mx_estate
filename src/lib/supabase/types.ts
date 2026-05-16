export type PropertyType = "sale" | "rent";
export type ExpatCommunitySize = "small" | "medium" | "large";
export type InternetQuality = "poor" | "good" | "excellent";
export type LeadTimeline = "asap" | "3mo" | "6mo" | "1yr";

export interface City {
  id: string;
  name: string;
  state: string;
  slug: string;
  description_en: string | null;
  safety_rating: number | null;
  expat_community_size: ExpatCommunitySize | null;
  avg_rent_usd: number | null;
  avg_sale_usd: number | null;
  internet_quality: InternetQuality | null;
  created_at: string;
}

export interface Realtor {
  id: string;
  name: string;
  photo_url: string | null;
  bio_en: string | null;
  languages: string[];
  cities: string[];
  phone: string | null;
  email: string | null;
  expat_deals_count: number;
  is_verified: boolean;
  commission_pct: number | null;
  created_at: string;
}

export interface Property {
  id: string;
  title: string;
  description_en: string | null;
  description_es: string | null;
  price_usd: number;
  type: PropertyType;
  city_id: string;
  neighborhood: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_sqm: number | null;
  images: string[];
  lat: number | null;
  lng: number | null;
  is_restricted_zone: boolean;
  fideicomiso_required: boolean;
  legal_notes: string | null;
  realtor_id: string | null;
  source_url: string | null;
  is_verified: boolean;
  created_at: string;
}

export interface Lead {
  id: string;
  property_id: string | null;
  realtor_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  budget_usd: number | null;
  timeline: LeadTimeline | null;
  created_at: string;
}

type TableShape<TRow> = {
  Row: TRow;
  Insert: Partial<TRow>;
  Update: Partial<TRow>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      cities: TableShape<City>;
      realtors: TableShape<Realtor>;
      properties: TableShape<Property>;
      leads: TableShape<Lead>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      property_type: PropertyType;
      expat_community_size: ExpatCommunitySize;
      internet_quality: InternetQuality;
      lead_timeline: LeadTimeline;
    };
    CompositeTypes: Record<string, never>;
  };
}

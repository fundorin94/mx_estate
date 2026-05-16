-- MX Estate initial schema
-- Tables: cities, realtors, properties, leads

create extension if not exists "pgcrypto";

-- Enums --------------------------------------------------------------------
create type property_type as enum ('sale', 'rent');
create type expat_community_size as enum ('small', 'medium', 'large');
create type internet_quality as enum ('poor', 'good', 'excellent');
create type lead_timeline as enum ('asap', '3mo', '6mo', '1yr');

-- cities -------------------------------------------------------------------
create table cities (
  id                    uuid primary key default gen_random_uuid(),
  name                  text not null,
  state                 text not null,
  slug                  text not null unique,
  description_en        text,
  safety_rating         smallint check (safety_rating between 1 and 10),
  expat_community_size  expat_community_size,
  avg_rent_usd          integer check (avg_rent_usd >= 0),
  avg_sale_usd          integer check (avg_sale_usd >= 0),
  internet_quality      internet_quality,
  created_at            timestamptz not null default now()
);

create index cities_slug_idx on cities (slug);

-- realtors -----------------------------------------------------------------
create table realtors (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  photo_url           text,
  bio_en              text,
  languages           text[] not null default '{}',
  cities              text[] not null default '{}',
  phone               text,
  email               text,
  expat_deals_count   smallint not null default 0 check (expat_deals_count >= 0),
  is_verified         boolean not null default false,
  commission_pct      numeric(4,2) check (commission_pct between 0 and 100),
  created_at          timestamptz not null default now()
);

create index realtors_is_verified_idx on realtors (is_verified);

-- properties ---------------------------------------------------------------
create table properties (
  id                     uuid primary key default gen_random_uuid(),
  title                  text not null,
  description_en         text,
  description_es         text,
  price_usd              integer not null check (price_usd >= 0),
  type                   property_type not null,
  city_id                uuid not null references cities(id) on delete restrict,
  neighborhood           text,
  bedrooms               smallint check (bedrooms >= 0),
  bathrooms              numeric(3,1) check (bathrooms >= 0),
  area_sqm               numeric(8,2) check (area_sqm >= 0),
  images                 text[] not null default '{}',
  lat                    numeric(9,6),
  lng                    numeric(9,6),
  is_restricted_zone     boolean not null default false,
  fideicomiso_required   boolean not null default false,
  legal_notes            text,
  realtor_id             uuid references realtors(id) on delete set null,
  source_url             text,
  is_verified            boolean not null default false,
  created_at             timestamptz not null default now()
);

create index properties_city_id_idx       on properties (city_id);
create index properties_realtor_id_idx    on properties (realtor_id);
create index properties_type_idx          on properties (type);
create index properties_price_usd_idx     on properties (price_usd);
create index properties_is_verified_idx   on properties (is_verified);

-- leads --------------------------------------------------------------------
create table leads (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid references properties(id) on delete set null,
  realtor_id   uuid references realtors(id) on delete set null,
  name         text not null,
  email        text not null,
  phone        text,
  message      text,
  budget_usd   integer check (budget_usd >= 0),
  timeline     lead_timeline,
  created_at   timestamptz not null default now()
);

create index leads_property_id_idx  on leads (property_id);
create index leads_realtor_id_idx   on leads (realtor_id);
create index leads_created_at_idx   on leads (created_at desc);

-- Row Level Security -------------------------------------------------------
alter table cities     enable row level security;
alter table realtors   enable row level security;
alter table properties enable row level security;
alter table leads      enable row level security;

-- Public read for catalog data
create policy "Public read cities"     on cities     for select using (true);
create policy "Public read realtors"   on realtors   for select using (true);
create policy "Public read properties" on properties for select using (true);

-- Leads: anonymous users may insert (form submission), nobody can read except service role
create policy "Anyone can submit a lead" on leads for insert with check (true);

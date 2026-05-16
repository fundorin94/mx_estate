-- Seed realtors and sample properties for /properties page demo.
-- Safe to run multiple times: clears the demo rows by name/title before inserting.

delete from properties where source_url = 'seed://demo';
delete from realtors  where email like '%@mx-estate.demo';

insert into realtors (name, photo_url, bio_en, languages, cities, phone, email, expat_deals_count, is_verified, commission_pct)
values
  ('Maria Gonzalez', null, 'Specialist in beachfront properties in Los Cabos. 12+ years working with US and Canadian buyers.',
   '{en,es}', '{Cabo San Lucas}', '+52 624 100 0001', 'maria@mx-estate.demo', 34, true, 22.00),
  ('Carlos Mendoza',  null, 'Puerto Vallarta and surrounding bays. Helps foreign buyers navigate fideicomiso and closings.',
   '{en,es}', '{Puerto Vallarta}', '+52 322 100 0002', 'carlos@mx-estate.demo', 21, true, 20.00),
  ('Sofia Ramirez',  null, 'Colonial properties in San Miguel de Allende. Works exclusively with expat retirees.',
   '{en,es,fr}', '{San Miguel de Allende}', '+52 415 100 0003', 'sofia@mx-estate.demo', 19, true, 25.00);

-- Properties --------------------------------------------------------------
insert into properties (
  title, description_en, price_usd, type, city_id, neighborhood,
  bedrooms, bathrooms, area_sqm, images, lat, lng,
  is_restricted_zone, fideicomiso_required, legal_notes,
  realtor_id, source_url, is_verified
)
select * from (values
  -- Cabo San Lucas (restricted zone — fideicomiso required)
  ('Oceanfront 3BR condo in Pedregal',
   'Modern 3-bedroom condo with panoramic Pacific views. Walking distance to marina.',
   685000, 'sale'::property_type,
   (select id from cities where slug='cabo-san-lucas'), 'Pedregal',
   3::smallint, 3.5::numeric(3,1), 215.0::numeric(8,2),
   array['https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800']::text[],
   22.880200::numeric(9,6), -109.916400::numeric(9,6),
   true, true,
   'Located within 50km of the coast — foreign buyers must use a fideicomiso (bank trust). Estimated trust setup: $2.5k + $700/yr.',
   (select id from realtors where email='maria@mx-estate.demo'),
   'seed://demo', true),

  ('2BR villa with private pool — Marina',
   'Recently renovated villa, short-term rental potential, gated community.',
   3200, 'rent'::property_type,
   (select id from cities where slug='cabo-san-lucas'), 'Marina',
   2::smallint, 2.0::numeric(3,1), 140.0::numeric(8,2),
   array['https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800']::text[],
   22.886500::numeric(9,6), -109.908100::numeric(9,6),
   true, false, 'Long-term rental — fideicomiso not required.',
   (select id from realtors where email='maria@mx-estate.demo'),
   'seed://demo', true),

  ('Beachfront penthouse — 4BR',
   'Top-floor penthouse with rooftop terrace, direct beach access. Sold furnished.',
   1450000, 'sale'::property_type,
   (select id from cities where slug='cabo-san-lucas'), 'Médano Beach',
   4::smallint, 4.0::numeric(3,1), 340.0::numeric(8,2),
   array['https://images.unsplash.com/photo-1582268611958-ebfd161df9d8?w=800']::text[],
   22.890900::numeric(9,6), -109.906000::numeric(9,6),
   true, true,
   'Fideicomiso required. HOA $850/mo includes pool, gym, beach club access.',
   (select id from realtors where email='maria@mx-estate.demo'),
   'seed://demo', true),

  -- Puerto Vallarta (restricted zone)
  ('Old Town 2BR condo with ocean view',
   'Walk to Los Muertos beach. Recently updated, AC throughout, building has pool.',
   395000, 'sale'::property_type,
   (select id from cities where slug='puerto-vallarta'), 'Zona Romántica',
   2::smallint, 2.0::numeric(3,1), 110.0::numeric(8,2),
   array['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800']::text[],
   20.602700::numeric(9,6), -105.236500::numeric(9,6),
   true, true,
   'Fideicomiso required (within 50km of coast). HOA $320/mo.',
   (select id from realtors where email='carlos@mx-estate.demo'),
   'seed://demo', true),

  ('Studio rental — Conchas Chinas',
   'Quiet residential area, walk to the beach. Includes utilities and weekly cleaning.',
   1100, 'rent'::property_type,
   (select id from cities where slug='puerto-vallarta'), 'Conchas Chinas',
   0::smallint, 1.0::numeric(3,1), 45.0::numeric(8,2),
   array['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800']::text[],
   20.591200::numeric(9,6), -105.243800::numeric(9,6),
   true, false, 'Long-term rental.',
   (select id from realtors where email='carlos@mx-estate.demo'),
   'seed://demo', true),

  ('3BR house — Nuevo Vallarta',
   'Family home in gated community, golf course access, 15min to airport.',
   520000, 'sale'::property_type,
   (select id from cities where slug='puerto-vallarta'), 'Nuevo Vallarta',
   3::smallint, 2.5::numeric(3,1), 260.0::numeric(8,2),
   array['https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800']::text[],
   20.692500::numeric(9,6), -105.292100::numeric(9,6),
   true, true,
   'Fideicomiso required. Community fees $180/mo.',
   (select id from realtors where email='carlos@mx-estate.demo'),
   'seed://demo', true),

  -- San Miguel de Allende (NOT restricted zone — inland)
  ('Colonial 4BR home — Centro Histórico',
   'Restored 18th-century home, courtyard with fountain, walking distance to the Jardín.',
   780000, 'sale'::property_type,
   (select id from cities where slug='san-miguel-de-allende'), 'Centro Histórico',
   4::smallint, 3.0::numeric(3,1), 380.0::numeric(8,2),
   array['https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800']::text[],
   20.914300::numeric(9,6), -100.744100::numeric(9,6),
   false, false,
   'Inland location — foreign buyers can purchase directly without fideicomiso.',
   (select id from realtors where email='sofia@mx-estate.demo'),
   'seed://demo', true),

  ('1BR loft rental — San Antonio',
   'Artist district, rooftop with mountain views, monthly utilities included.',
   1400, 'rent'::property_type,
   (select id from cities where slug='san-miguel-de-allende'), 'San Antonio',
   1::smallint, 1.0::numeric(3,1), 65.0::numeric(8,2),
   array['https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800']::text[],
   20.905700::numeric(9,6), -100.749900::numeric(9,6),
   false, false, '6-month minimum lease.',
   (select id from realtors where email='sofia@mx-estate.demo'),
   'seed://demo', true)
) as v(
  title, description_en, price_usd, type, city_id, neighborhood,
  bedrooms, bathrooms, area_sqm, images, lat, lng,
  is_restricted_zone, fideicomiso_required, legal_notes,
  realtor_id, source_url, is_verified
);

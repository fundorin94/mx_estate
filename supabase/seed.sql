-- Seed data for local development (3 launch cities)
insert into cities (name, state, slug, description_en, safety_rating, expat_community_size, avg_rent_usd, avg_sale_usd, internet_quality)
values
  ('Cabo San Lucas',         'Baja California Sur', 'cabo-san-lucas',         'Beach resort town on the southern tip of Baja, popular with US retirees.', 8,  'large',  1800, 450000, 'good'),
  ('Puerto Vallarta',        'Jalisco',             'puerto-vallarta',        'Pacific coast city with a long-established expat community.',            8,  'large',  1500, 380000, 'good'),
  ('San Miguel de Allende',  'Guanajuato',          'san-miguel-de-allende',  'UNESCO colonial town in the highlands, popular for art and culture.',     9,  'medium', 1400, 350000, 'excellent');

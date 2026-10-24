-- ============================================================
-- AMATE 38 — COMPLETE DATABASE RESET & RESTORE
-- ============================================================

-- 1. DROP AND RE-CREATE TABLES (Clean Slate)
DROP TABLE IF EXISTS public.menu_items CASCADE;
DROP TABLE IF EXISTS public.restaurant_secrets CASCADE;

CREATE TABLE public.restaurant_secrets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_code text NOT NULL DEFAULT 'AMATE2026',
  admin_password text NOT NULL DEFAULT 'amate-admin-38',
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public.menu_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en text NOT NULL,
  name_es text NOT NULL,
  description_en text,
  description_es text,
  price text NOT NULL,
  category text NOT NULL,
  image text,
  active boolean DEFAULT true NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. ENABLE SECURITY
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_secrets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING ( active = true );
CREATE POLICY "Service role manages menu items" ON public.menu_items FOR ALL USING (true);
CREATE POLICY "Service role manages secrets" ON public.restaurant_secrets FOR ALL USING (true);
-- Added: Allow anon to read secrets so the server (which might use anon key) can check password backup
CREATE POLICY "Anon can view secrets" ON public.restaurant_secrets FOR SELECT USING (true);

-- 3. SEED ADMIN SECRETS
INSERT INTO public.restaurant_secrets (restaurant_code, admin_password)
VALUES ('AMATE2026', 'amate-admin-38');

-- 4. SEED COMPREHENSIVE MENU DATA (From Knowledge Base & Menu Files)
INSERT INTO public.menu_items (name_en, name_es, description_en, description_es, price, category, order_index)
VALUES 
  -- BREAKFAST
  ('Fruit Salad', 'Ensalada de Fruta', 'Fresh seasonal fruit with local honey, pumpkin seeds and chia.', 'Fruta fresca de temporada con miel local, pepita de calabaza y chía.', '$180', 'Breakfast', 1),
  ('Oatmeal with Cacao Nibs', 'Avena con Nibs de Cacao', 'Served with fresh fruit, cinnamon and local honey.', 'Servida con fruta fresca, canela y miel local.', '$190', 'Breakfast', 2),
  ('Mexican Eggs (Guarnición)', 'Huevos Revueltos o Fritos', 'Choice of: Longaniza, turkey ham, smoked pork, chaya, epazote, ibes, etc.', 'Con longaniza, jamón de pavo, pierna ahumada, queso de bola, chaya, etc.', '$192', 'Breakfast', 3),
  ('Huevos Motulenos', 'Huevos Motuleños', 'Tostadas with refried beans, fried eggs, tomato sauce, peas, ham and cheese.', 'Tostadas con frijol refrito, huevos estrellados, salsa de tomate y queso manchego.', '$192', 'Breakfast', 4),
  ('Chaya Omelet', 'Omelet de Chaya', 'Chaya and queso de bola omelet over fried tomato sauce.', 'Relleno de chaya y queso de bola sobre salsa de tomate frito.', '$192', 'Breakfast', 5),
  ('Omelet Amate', 'Omelet Amate', 'Egg white omelet with spearmint, fried plantain and queso de bola.', 'Claras rellenas de hierbabuena, plátano macho y queso de bola.', '$204', 'Breakfast', 6),
  ('Cochinita Pibil Tacos (3)', 'Tacos de Cochinita Pibil (3)', 'Handmade tortilla filled with cochinita pibil, pickled onion and frijol kabax.', 'Tortilla hecha a mano con cochinita pibil, cebolla curtida y frijol kabax.', '$208', 'Breakfast', 7),
  ('Green Chilaquiles (Xcatic)', 'Chilaquiles Verdes', 'Green tomatillo and xcatic chile salsa. With chicken or egg.', 'Salsa de tomate verde y chile xcatic. Con pollo o huevo.', '$208', 'Breakfast', 8),

  -- LUNCH
  ('Guacamole', 'Guacamole (para 2)', 'Avocado with onion, tomato, cilantro and queso sopero.', 'Aguacate con cebolla, jitomate, cilantro y queso sopero.', '$218', 'Lunch', 20),
  ('Panuchos or Salbutes (3)', 'Panuchos o Salbutes (3)', 'Grilled escabeche chicken or cochinita pibil.', 'De pollo asado en escabeche o cochinita pibil.', '$218', 'Lunch', 21),
  ('Lime Soup', 'Sopa de Lima', 'Chicken broth with shredded chicken, sweet pepper, lime slices and tortilla strips.', 'Caldo de pavo deshebrado, lima, chile dulce y juliana de tortilla.', '$192', 'Lunch', 22),
  ('Sikil Pa’k', 'Sikil Pa’k', 'Roasted pumpkin seed purée with tomato and xcatic chile.', 'Puré de pepita de calabaza, jitomate y chile xcatic asado.', '$192', 'Lunch', 23),
  ('Papadzules', 'Papadzules', 'Egg-filled tortillas in pumpkin seed and epazote sauce.', 'Tacos de huevo cocido bañados con salsa de pepita y epazote.', '$242', 'Lunch', 24),
  ('Yucatecan Chicken Breast', 'Pechuga a la Yucateca', 'In recado rojo and sour orange, grilled over coals.', 'Marinada con recado rojo y naranja agria, asada a la brasa.', '$372', 'Lunch', 25),
  ('Poc Chuc', 'Poc Chuc', 'Pork loin in recado blanco, grilled with purple onion and chiltomate.', 'Lomo de cerdo en recado blanco, con cebolla asada y chiltomate.', '$372', 'Lunch', 26),

  -- DINNER
  ('Shrimp Ceviche (Red Recado)', 'Ceviche de Camarón', 'Shrimp marinated in sour orange juice, recado rojo and olive oil.', 'Camarón marinado en jugo de naranja agria y recado rojo.', '$258', 'Dinner', 40),
  ('Chaya Cream Soup', 'Crema de Chaya', 'Chaya soup with panela cheese and achiote oil.', 'Crema de chaya con queso panela y aceite de achiote.', '$182', 'Dinner', 41),
  ('Beef Tenderloin (Charcoal)', 'Filete de Res al Carbón', 'Beef medallion on recado negro sauce, with vegetables and sweet potato purée.', 'Medallón de res sobre salsa de recado negro y puré de camote.', '$462', 'Dinner', 42),
  ('Tuna Fillet (Charcoal)', 'Filete de Atún al Carbón', 'Over recado rojo sauce, with black rice and vegetables.', 'Sobre salsa de recado rojo, arroz negro y verduras.', '$412', 'Dinner', 43),
  ('Cochinita Pibil (Dinner)', 'Cochinita Pibil', 'Achiote pork leg, pickled onion and frijol kabax.', 'Pierna de cerdo al achiote y frijol kabax.', '$372', 'Dinner', 44),
  ('Lomitos Valladolid', 'Lomitos de Valladolid', 'Pork stewed in tomato and chawaik chile sauce.', 'Trocitos de cerdo guisados en salsa de tomate y chile chawaik.', '$372', 'Dinner', 45),

  -- VEGAN
  ('Vegan Kibis (2)', 'Kibis Veganos (2)', 'Cracked wheat with chaya, ibes and epazote.', 'Trigo quebrado con chaya, ibes y epazote.', '$212', 'Vegan', 60),
  ('Vegan Tostadas (3)', 'Tostadas de Vegetales (3)', 'Sauteed veggies with avocado and pumpkin seeds.', 'Verduras salteadas con aguacate y pepita de calabaza.', '$182', 'Vegan', 61),
  ('Coconut & Pineapple Ceviche', 'Ceviche de Coco y Piña', 'Coconut strips with lime, pineapple, cucumber and avocado.', 'Tiras de coco marinado con piña, pepino y aguacate.', '$192', 'Vegan', 62),
  ('Vegan Papadzules (3)', 'Papadzules Veganos (3)', 'Filled with chaya or local squash in pumpkin seed sauce.', 'Rellenos de chaya o calabaza en salsa de pepita.', '$242', 'Vegan', 63),
  ('Vegetable Skewers (2)', 'Brochetas de Vegetales (2)', 'Roasted with recado rojo and blanco.', 'Rostizadas a las brasas con recado rojo y blanco.', '$238', 'Vegan', 64),
  ('Vaporcitos (3)', 'Vaporcitos de Chaya (3)', 'Steamed chaya corn tamales.', 'Tamales de maíz con chaya al vapor.', '$224', 'Vegan', 65),

  -- DRINKS (Extracted from Menu Bebidas.txt)
  ('Fresh Waters', 'Aguas Frescas', 'Lima, sour orange, tamarind, horchata or Jamaica.', 'Lima, naranja agria, tamarindo, horchata o Jamaica.', '$76', 'Drinks', 80),
  ('Natural Juices', 'Jugos Naturales', 'Orange, grapefruit, watermelon, papaya, pineapple, chaya, etc.', 'Naranja, toronja, sandía, papaya, piña, chaya, etc.', '$84', 'Drinks', 81),
  ('American Coffee', 'Café Americano', 'Freshly brewed Mexican coffee.', 'Café mexicano recién hecho.', '$78', 'Drinks', 82),
  ('Cappuccino', 'Capuchino', 'Rich espresso with steamed milk.', 'Espreso con leche cremada.', '$86', 'Drinks', 83),
  ('Artisanal Mezcal Cocktails', 'Coctelería de Mezcal', 'TZALAM, CHECHEN, KATALOX or JABIM flavors.', 'TZALAM, CHECHEN, KATALOX o JABIM.', '$210', 'Drinks', 84),
  ('Bohemia / Heineken', 'Cervezas', 'Clara, Oscura or Heineken.', 'Bohemia clara, oscura o Heineken.', '$74', 'Drinks', 85),
  ('XX Lager / Ambar', 'Cervezas XX', 'XX Lager, XX Ambar, Tecate Light or Sol.', 'XX Lager, XX Ambar, Tecate Light o Sol.', '$72', 'Drinks', 86),
  
  -- WINES (Extracted from Menu Vinos.txt)
  ('Sauvignon Blanc (Glass)', 'Sauvignon Blanc (Copa)', 'Santo Tomás (Mexico)', 'Santo Tomás (México)', '$130', 'Wine', 100),
  ('Sauvignon Blanc (Bottle)', 'Sauvignon Blanc (Botella)', 'Santo Tomás (Mexico)', 'Santo Tomás (México)', '$522', 'Wine', 101),
  ('Tempranillo (Glass)', 'Tempranillo (Copa)', 'Santo Tomás (Mexico)', 'Santo Tomás (México)', '$148', 'Wine', 102),
  ('Tempranillo (Bottle)', 'Tempranillo (Botella)', 'Santo Tomás (Mexico)', 'Santo Tomás (México)', '$688', 'Wine', 103),
  ('Shiraz Merlot', 'Shiraz Merlot', 'Villa Montefiori (Bottle)', 'Villa Montefiori (Botella)', '$866', 'Wine', 104),
  ('Chardonnay', 'Chardonnay', 'Corona del Valle (Bottle)', 'Corona del Valle (Botella)', '$782', 'Wine', 105),

  -- DESSERTS (Postres)
  ('Coconut Flan', 'Flan de Coco', 'With natural coconut milk and pumpkin seed brittle.', 'Con leche de coco y palanqueta de pepita.', '$172', 'Dinner', 120),
  ('Queso de Bola Cheesecake', 'Pay de Queso de Bola', 'Traditional Yucatecan cheesecake.', 'Tradicional pay de queso de bola.', '$212', 'Dinner', 121),
  ('Rice Pudding', 'Arroz con Leche', 'With cardamom and cinnamon.', 'Con cardamomo y canela.', '$168', 'Dinner', 122);

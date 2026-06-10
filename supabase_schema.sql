-- ═══════════════════════════════════════════════════════════
-- AGOMA. — Schema do banco de dados
-- Rodar no Supabase: Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════

-- ── Tabelas ──────────────────────────────────────────────────

CREATE TABLE public.menu_items (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  external_id    TEXT UNIQUE NOT NULL,
  name           TEXT NOT NULL,
  description    TEXT DEFAULT '',
  price          NUMERIC(10,2) NOT NULL,
  category       TEXT NOT NULL,
  image_url      TEXT,
  badge          TEXT,
  has_meat_point BOOLEAN DEFAULT FALSE,
  can_be_combo   BOOLEAN DEFAULT FALSE,
  max_additionals INTEGER DEFAULT 10,
  active         BOOLEAN DEFAULT TRUE,
  display_order  INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orders (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total      NUMERIC(10,2) NOT NULL,
  address    JSONB,
  status     TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id    UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  item_name   TEXT NOT NULL,
  item_price  NUMERIC(10,2) NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  meat_point  TEXT,
  is_combo    BOOLEAN DEFAULT FALSE,
  combo_drink TEXT,
  additionals JSONB DEFAULT '[]',
  subtotal    NUMERIC(10,2) NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── RLS (Row Level Security) ──────────────────────────────────

ALTER TABLE public.menu_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Cardápio: leitura pública
CREATE POLICY "menu_public_read"   ON public.menu_items  FOR SELECT USING (true);
CREATE POLICY "menu_anon_insert"   ON public.menu_items  FOR INSERT WITH CHECK (true);
CREATE POLICY "menu_anon_update"   ON public.menu_items  FOR UPDATE USING (true);
CREATE POLICY "menu_anon_delete"   ON public.menu_items  FOR DELETE USING (true);

-- Pedidos: qualquer um pode criar (checkout), todos podem ler (admin)
CREATE POLICY "orders_insert"      ON public.orders      FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_read"        ON public.orders      FOR SELECT USING (true);
CREATE POLICY "orders_update"      ON public.orders      FOR UPDATE USING (true);

CREATE POLICY "order_items_insert" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_read"   ON public.order_items FOR SELECT USING (true);

-- ── Seed: todos os itens do cardápio ─────────────────────────

INSERT INTO public.menu_items (external_id, name, description, price, category, image_url, badge, has_meat_point, can_be_combo, display_order) VALUES

-- CIABATTAS
('ciab-caprese',      'Caprese',      'Pão, molho de tomate artesanal, queijo prato gratinado, rúcula, tomate e mayo verde.',                                         30, 'ciabattas', '/assets/images/IMG_6373.jpg',                            '🌿 veg', false, true,  10),
('ciab-gallus',       'Gallus',       'Pão, o Nosso Frango, requeijão cremoso, rúcula, tomate, picles de pepino e mayo verde.',                                         32, 'ciabattas', '/assets/images/IMG_6351.jpg',                            null,      false, true,  20),
('ciab-cheddar-porkus','Cheddar Porkus','Pão, a Nossa Costelinha, cheddar D''Agoma, barbecue, rúcula e tomate.',                                                       39, 'ciabattas', '/assets/images/IMG_6419.png',                            null,      false, true,  30),
('ciab-gallus-fritus','Gallus Fritus','Pão, nosso Frango Frito crocante por fora e suculento por dentro, mayo limão, queijo meleca e picles de pepino.',               37, 'ciabattas', '/assets/images/IMG_6208.jpg',                            null,      false, true,  40),

-- BURGUERS
('burg-smash-meleca', 'Smash Meleca',    'Pão brioche, burger smash, queijo prato cremoso e picles de pepino.',                           26, 'burguers', '/assets/images/IMG_6469.jpg',  null,      true,  true,  10),
('burg-cheese',       'Cheese Burguer',  'O óbvio. Pão brioche, Blend D''Agoma e queijo prato.',                                         29, 'burguers', '/assets/images/IMG_6472.jpg',  null,      true,  true,  20),
('burg-cheese-salada','Cheese Salada',   'Pão brioche, Blend D''Agoma, queijo prato, mayo verde, alface e tomate.',                      33, 'burguers', '/assets/images/IMG_6478.jpg',  null,      true,  true,  30),
('burg-cheddar-agoma','Cheddar D''AGOMA','Pão brioche, Blend D''Agoma, nossa cheddar e cebola crispy ou farofa de bacon.',               35, 'burguers', '/assets/images/IMG_6704.jpg',  '⭐ top',  true,  true,  40),
('burg-cheddar-porkus','Cheddar Porkus', 'Pão brioche, Blend D''Agoma, cheddar D''Agoma e a Nossa Costelinha.',                          39, 'burguers', '/assets/images/IMG_5931.jpg',  null,      true,  true,  50),
('burg-trufa-deli',   'TrufaDeli',       'Cheeseburger clássico com mayo trufada.',                                                      37, 'burguers', null,                            null,      true,  true,  60),

-- WRAPS
('wrap-gallus',       'Gallus',       'Pão folha, alface, tomate, mayo verde, picles de pepino, requeijão cremoso e o Nosso Frango.',    29, 'wraps', '/assets/images/IMG_6422.jpg', null, false, true, 10),
('wrap-porkus',       'Porkus',       'Pão folha, alface, tomate, barbecue, requeijão cremoso e a Nossa Costelinha de porco.',            35, 'wraps', null,                          null, false, true, 20),
('wrap-tirus-fritus', 'Tirus Fritus', 'Pão folha, alface, tomate, mayo 2 limões, queijo meleca e nosso delicioso frango frito.',         34, 'wraps', null,                          null, false, true, 30),

-- FRITAS
('frit-casa',         'Fritas da Casa',           'Fritas feitas na nossa goma.',                                                 25, 'fritas', '/assets/images/73165894-f970-4aac-9add-17f052031f5d.jpg', '⭐ top', false, false, 10),
('frit-cheddar-agoma','Fritas Cheddar D''AGOMA',  'Fritas da casa, cheddar D''Agoma e farofa de bacon.',                          30, 'fritas', '/assets/images/5bf0e137-79e0-4bd2-96a4-8a284fd98c85.jpg', null,     false, false, 20),
('frit-porkus',       'Fritas Porkus',             'Fritas da casa, mayo dos limões, Nossa Costelinha e requeijão cremoso.',      36, 'fritas', '/assets/images/7149ef20-d40b-4226-8f9c-3a939808d06e.jpg', null,     false, false, 30),
('frit-trufa-crispy', 'Fritas Trufa Crispy',       'Fritas da casa, mayo trufada e cebola crispy.',                               35, 'fritas', '/assets/images/467ff1f5-060f-44ef-a2a9-f54c9f558756.jpg', '⭐ top', false, false, 40),

-- CROISSANTS
('croa-burguer', 'Croaburguer', 'Croissant, dois burger smash, queijo prato cremoso, mayo dos limões, bacon e mel.', 41, 'croissants', null, '🔥 novo', true,  true, 10),
('croa-porkus',  'CroaPorkus',  'Croissant, a Nossa Costelinha e requeijão cremoso.',                                26, 'croissants', null, null,      false, true, 20),
('croa-gallus',  'CroaGallus',  'Croissant, o Nosso Frango e requeijão cremoso.',                                   21, 'croissants', null, null,      false, true, 30),

-- SOBREMESAS
('sob-brig-nutella',  'Brigadeiro Nutella',           'Com brownie.',                    7,  'sobremesas', null, null, false, false, 10),
('sob-brig-ninho',    'Brigadeiro Ninho',              'Com frutas vermelhas.',           8,  'sobremesas', null, null, false, false, 20),
('sob-brownie',       'Brownie',                       'O clássico.',                     15, 'sobremesas', null, null, false, false, 30),
('sob-brownie-cob',   'Brownie c/ Cobertura',          'Brownie com cobertura especial.', 26, 'sobremesas', null, null, false, false, 40),
('sob-croa-nutella',  'Croissant Nutella',             'Croissant recheado com nutella.', 23, 'sobremesas', null, null, false, false, 50),
('sob-croa-nut-sorv', 'Croissant Nutella c/ Sorvete', 'Croissant nutella com sorvete.',  29, 'sobremesas', null, null, false, false, 60),
('sob-croa-ninho',    'Croissant Ninho',               'Com frutas vermelhas.',           24, 'sobremesas', null, null, false, false, 70),
('sob-milk-brow',     'Milkshake Brownie',             '',                                28, 'sobremesas', null, null, false, false, 80),
('sob-milk-nut',      'Milkshake Nutella',             '',                                31, 'sobremesas', null, null, false, false, 90),
('sob-milk-ovo',      'Milkshake Ovomaltine',          '',                                29, 'sobremesas', null, null, false, false, 100),
('sob-milk-brow-nut', 'Milkshake Nutella e Brownie',   '',                                33, 'sobremesas', null, null, false, false, 110),

-- BEBIDAS
('beb-coca',      'Coca-Cola',       '', 8,  'bebidas', null, null, false, false, 10),
('beb-coca-zero', 'Coca-Cola Zero',  '', 8,  'bebidas', null, null, false, false, 20),
('beb-gua-zero',  'Guaraná Zero',    '', 8,  'bebidas', null, null, false, false, 30),
('beb-agua-sem',  'Água sem gás',    '', 6,  'bebidas', null, null, false, false, 40),
('beb-agua-com',  'Água com gás',    '', 6,  'bebidas', null, null, false, false, 50),
('beb-heineken',  'Heineken',        '', 15, 'bebidas', null, null, false, false, 60),
('beb-corona',    'Corona',          '', 15, 'bebidas', null, null, false, false, 70),
('beb-original',  'Original',        '', 12, 'bebidas', null, null, false, false, 80),

-- ADICIONAIS
('add-mayo-lim',    'Mayo 2 Limões',    '', 6,  'adicionais', null, null, false, false, 10),
('add-mayo-verde',  'Mayo Verde',       '', 5,  'adicionais', null, null, false, false, 20),
('add-mayo-trufa',  'Mayo Trufada',     '', 9,  'adicionais', null, null, false, false, 30),
('add-cheddar',     'Cheddar D''AGOMA', '', 9,  'adicionais', null, null, false, false, 40),
('add-queijo-mel',  'Queijo Meleca',    '', 8,  'adicionais', null, null, false, false, 50),
('add-costelinha',  'Nossa Costelinha', '', 13, 'adicionais', null, null, false, false, 60),
('add-burg-queijo', 'Burguer + Queijo', '', 14, 'adicionais', null, null, false, false, 70),
('add-farofa',      'Farofa de Bacon',  '', 5,  'adicionais', null, null, false, false, 80),
('add-cebola',      'Cebola Crispy',    '', 5,  'adicionais', null, null, false, false, 90),
('add-bacon-mel',   'Bacon MELado',     '', 7,  'adicionais', null, null, false, false, 100);

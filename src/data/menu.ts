import type { MenuItem, CategoryInfo, CartItemAdditional } from '../types';

export const CATEGORIES: CategoryInfo[] = [
  { id: 'ciabattas',  label: 'Ciabattas',   emoji: '🥖' },
  { id: 'burguers',   label: 'Burguers',    emoji: '🍔' },
  { id: 'wraps',      label: 'Wraps',       emoji: '🌯' },
  { id: 'fritas',     label: 'Fritas',      emoji: '🍟' },
  { id: 'croissants', label: 'Croissants',  emoji: '🥐' },
  { id: 'sobremesas', label: 'Sobremesas',  emoji: '🍫' },
  { id: 'bebidas',    label: 'Bebidas',     emoji: '🥤' },
  { id: 'adicionais', label: 'Adicionais',  emoji: '➕' },
];

export const MENU_ITEMS: MenuItem[] = [
  // ── CIABATTAS ────────────────────────────────────────────────────
  {
    id: 'ciab-caprese',
    category: 'ciabattas',
    name: 'Caprese',
    description: 'Pão, molho de tomate artesanal, queijo prato gratinado, rúcula, tomate e mayo verde.',
    price: 30,
    image: '/assets/images/IMG_6373.jpg',
    badge: '🌿 veg',
    canBeCombo: true,
  },
  {
    id: 'ciab-gallus',
    category: 'ciabattas',
    name: 'Gallus',
    description: 'Pão, o Nosso Frango, requeijão cremoso, rúcula, tomate, picles de pepino e mayo verde.',
    price: 32,
    image: '/assets/images/IMG_6351.jpg',
    canBeCombo: true,
  },
  {
    id: 'ciab-cheddar-porkus',
    category: 'ciabattas',
    name: 'Cheddar Porkus',
    description: 'Pão, a Nossa Costelinha, cheddar D\'Agoma, barbecue, rúcula e tomate.',
    price: 39,
    image: '/assets/images/IMG_6419.png',
    canBeCombo: true,
  },
  {
    id: 'ciab-gallus-fritus',
    category: 'ciabattas',
    name: 'Gallus Fritus',
    description: 'Pão, nosso Frango Frito crocante por fora e suculento por dentro, mayo limão, queijo meleca e picles de pepino.',
    price: 37,
    image: '/assets/images/IMG_6208.jpg',
    canBeCombo: true,
  },

  // ── BURGUERS ─────────────────────────────────────────────────────
  {
    id: 'burg-smash-meleca',
    category: 'burguers',
    name: 'Smash Meleca',
    description: 'Pão brioche, burger smash, queijo prato cremoso e picles de pepino.',
    price: 26,
    image: '/assets/images/IMG_6469.jpg',
    hasMeatPoint: true,
    canBeCombo: true,
  },
  {
    id: 'burg-cheese',
    category: 'burguers',
    name: 'Cheese Burguer',
    description: 'O óbvio. Pão brioche, Blend D\'Agoma e queijo prato.',
    price: 29,
    image: '/assets/images/IMG_6472.jpg',
    hasMeatPoint: true,
    canBeCombo: true,
  },
  {
    id: 'burg-cheese-salada',
    category: 'burguers',
    name: 'Cheese Salada',
    description: 'Pão brioche, Blend D\'Agoma, queijo prato, mayo verde, alface e tomate.',
    price: 33,
    image: '/assets/images/IMG_6478.jpg',
    hasMeatPoint: true,
    canBeCombo: true,
  },
  {
    id: 'burg-cheddar-agoma',
    category: 'burguers',
    name: 'Cheddar D\'AGOMA',
    description: 'Pão brioche, Blend D\'Agoma, nossa cheddar e cebola crispy ou farofa de bacon.',
    price: 35,
    image: '/assets/images/IMG_6704.jpg',
    badge: '⭐ top',
    hasMeatPoint: true,
    canBeCombo: true,
  },
  {
    id: 'burg-cheddar-porkus',
    category: 'burguers',
    name: 'Cheddar Porkus',
    description: 'Pão brioche, Blend D\'Agoma, cheddar D\'Agoma e a Nossa Costelinha.',
    price: 39,
    image: '/assets/images/IMG_5931.jpg',
    hasMeatPoint: true,
    canBeCombo: true,
  },
  {
    id: 'burg-trufa-deli',
    category: 'burguers',
    name: 'TrufaDeli',
    description: 'Cheeseburger clássico com mayo trufada.',
    price: 37,
    hasMeatPoint: true,
    canBeCombo: true,
  },

  // ── WRAPS ────────────────────────────────────────────────────────
  {
    id: 'wrap-gallus',
    category: 'wraps',
    name: 'Gallus',
    description: 'Pão folha, alface, tomate, mayo verde, picles de pepino, requeijão cremoso e o Nosso Frango.',
    price: 29,
    image: '/assets/images/IMG_6422.jpg',
    canBeCombo: true,
  },
  {
    id: 'wrap-porkus',
    category: 'wraps',
    name: 'Porkus',
    description: 'Pão folha, alface, tomate, barbecue, requeijão cremoso e a Nossa Costelinha de porco.',
    price: 35,
    canBeCombo: true,
  },
  {
    id: 'wrap-tirus-fritus',
    category: 'wraps',
    name: 'Tirus Fritus',
    description: 'Pão folha, alface, tomate, mayo 2 limões, queijo meleca e nosso delicioso frango frito.',
    price: 34,
    canBeCombo: true,
  },

  // ── FRITAS ───────────────────────────────────────────────────────
  {
    id: 'frit-casa',
    category: 'fritas',
    name: 'Fritas da Casa',
    description: 'Fritas feitas na nossa goma.',
    price: 25,
    image: '/assets/images/73165894-f970-4aac-9add-17f052031f5d.jpg',
    badge: '⭐ top',
  },
  {
    id: 'frit-cheddar-agoma',
    category: 'fritas',
    name: 'Fritas Cheddar D\'AGOMA',
    description: 'Fritas da casa, cheddar D\'Agoma e farofa de bacon.',
    price: 30,
    image: '/assets/images/5bf0e137-79e0-4bd2-96a4-8a284fd98c85.jpg',
  },
  {
    id: 'frit-porkus',
    category: 'fritas',
    name: 'Fritas Porkus',
    description: 'Fritas da casa, mayo dos limões, Nossa Costelinha e requeijão cremoso.',
    price: 36,
    image: '/assets/images/7149ef20-d40b-4226-8f9c-3a939808d06e.jpg',
  },
  {
    id: 'frit-trufa-crispy',
    category: 'fritas',
    name: 'Fritas Trufa Crispy',
    description: 'Fritas da casa, mayo trufada e cebola crispy.',
    price: 35,
    image: '/assets/images/467ff1f5-060f-44ef-a2a9-f54c9f558756.jpg',
    badge: '⭐ top',
  },

  // ── CROISSANTS ───────────────────────────────────────────────────
  {
    id: 'croa-burguer',
    category: 'croissants',
    name: 'Croaburguer',
    description: 'Croissant, dois burger smash, queijo prato cremoso, mayo dos limões, bacon e mel.',
    price: 41,
    badge: '🔥 novo',
    hasMeatPoint: true,
    canBeCombo: true,
  },
  {
    id: 'croa-porkus',
    category: 'croissants',
    name: 'CroaPorkus',
    description: 'Croissant, a Nossa Costelinha e requeijão cremoso.',
    price: 26,
    canBeCombo: true,
  },
  {
    id: 'croa-gallus',
    category: 'croissants',
    name: 'CroaGallus',
    description: 'Croissant, o Nosso Frango e requeijão cremoso.',
    price: 21,
    canBeCombo: true,
  },

  // ── SOBREMESAS ───────────────────────────────────────────────────
  { id: 'sob-brig-nutella',   category: 'sobremesas', name: 'Brigadeiro Nutella',           description: 'Com brownie.',                     price: 7  },
  { id: 'sob-brig-ninho',     category: 'sobremesas', name: 'Brigadeiro Ninho',              description: 'Com frutas vermelhas.',            price: 8  },
  { id: 'sob-brownie',        category: 'sobremesas', name: 'Brownie',                       description: 'O clássico.',                      price: 15 },
  { id: 'sob-brownie-cob',    category: 'sobremesas', name: 'Brownie c/ Cobertura',          description: 'Brownie com cobertura especial.',   price: 26 },
  { id: 'sob-croa-nutella',   category: 'sobremesas', name: 'Croissant Nutella',             description: 'Croissant recheado com nutella.',   price: 23 },
  { id: 'sob-croa-nut-sorv',  category: 'sobremesas', name: 'Croissant Nutella c/ Sorvete', description: 'Croissant nutella com sorvete.',    price: 29 },
  { id: 'sob-croa-ninho',     category: 'sobremesas', name: 'Croissant Ninho',               description: 'Com frutas vermelhas.',            price: 24 },
  { id: 'sob-milk-brow',      category: 'sobremesas', name: 'Milkshake Brownie',             description: '',                                 price: 28 },
  { id: 'sob-milk-nut',       category: 'sobremesas', name: 'Milkshake Nutella',             description: '',                                 price: 31 },
  { id: 'sob-milk-ovo',       category: 'sobremesas', name: 'Milkshake Ovomaltine',          description: '',                                 price: 29 },
  { id: 'sob-milk-brow-nut',  category: 'sobremesas', name: 'Milkshake Nutella e Brownie',   description: '',                                 price: 33 },

  // ── BEBIDAS ──────────────────────────────────────────────────────
  { id: 'beb-coca',          category: 'bebidas', name: 'Coca-Cola',        description: '', price: 8  },
  { id: 'beb-coca-zero',     category: 'bebidas', name: 'Coca-Cola Zero',   description: '', price: 8  },
  { id: 'beb-gua-zero',      category: 'bebidas', name: 'Guaraná Zero',     description: '', price: 8  },
  { id: 'beb-agua-sem',      category: 'bebidas', name: 'Água sem gás',     description: '', price: 6  },
  { id: 'beb-agua-com',      category: 'bebidas', name: 'Água com gás',     description: '', price: 6  },
  { id: 'beb-heineken',      category: 'bebidas', name: 'Heineken',         description: '', price: 15 },
  { id: 'beb-corona',        category: 'bebidas', name: 'Corona',           description: '', price: 15 },
  { id: 'beb-original',      category: 'bebidas', name: 'Original',         description: '', price: 12 },

  // ── ADICIONAIS ───────────────────────────────────────────────────
  { id: 'add-mayo-lim',    category: 'adicionais', name: 'Mayo 2 Limões',    description: '', price: 6  },
  { id: 'add-mayo-verde',  category: 'adicionais', name: 'Mayo Verde',       description: '', price: 5  },
  { id: 'add-mayo-trufa',  category: 'adicionais', name: 'Mayo Trufada',     description: '', price: 9  },
  { id: 'add-cheddar',     category: 'adicionais', name: "Cheddar D'AGOMA",  description: '', price: 9  },
  { id: 'add-queijo-mel',  category: 'adicionais', name: 'Queijo Meleca',    description: '', price: 8  },
  { id: 'add-costelinha',  category: 'adicionais', name: 'Nossa Costelinha', description: '', price: 13 },
  { id: 'add-burg-queijo', category: 'adicionais', name: 'Burguer + Queijo', description: '', price: 14 },
  { id: 'add-farofa',      category: 'adicionais', name: 'Farofa de Bacon',  description: '', price: 5  },
  { id: 'add-cebola',      category: 'adicionais', name: 'Cebola Crispy',    description: '', price: 5  },
  { id: 'add-bacon-mel',   category: 'adicionais', name: 'Bacon MELado',     description: '', price: 7  },
];

// Adicionais disponíveis para customização de qualquer item
export const AVAILABLE_ADDITIONALS: CartItemAdditional[] = MENU_ITEMS
  .filter((i) => i.category === 'adicionais')
  .map((i) => ({ id: i.id, name: i.name, price: i.price }));

export const FEATURED_ITEMS = MENU_ITEMS.filter((item) =>
  ['burg-cheddar-agoma', 'frit-trufa-crispy', 'ciab-gallus-fritus', 'croa-burguer'].includes(item.id)
);

export const COMBO_PRICE = 16;

export const COMBO_DRINKS = [
  'Coca-Cola',
  'Coca-Cola Zero',
  'Guaraná Zero',
  'Água sem gás',
  'Água com gás',
];

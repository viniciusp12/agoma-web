import { createClient } from '@supabase/supabase-js';

const url  = (import.meta.env.VITE_SUPABASE_URL  as string | undefined) ?? '';
const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

if (!url || !anon) {
  console.warn('[supabase] VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não definidos — usando cliente offline.');
}

export const supabase = createClient(
  url  || 'https://placeholder.supabase.co',
  anon || 'placeholder-key',
);

// ── Types ────────────────────────────────────────────────────────────────────

export interface DBMenuItem {
  id: string;
  external_id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  badge: string | null;
  has_meat_point: boolean;
  can_be_combo: boolean;
  max_additionals: number;
  active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface DBOrder {
  id: string;
  total: number;
  address: Record<string, string> | null;
  status: 'pending' | 'confirmed' | 'delivered' | 'cancelled';
  created_at: string;
}

export interface DBOrderItem {
  id: string;
  order_id: string;
  item_name: string;
  item_price: number;
  quantity: number;
  meat_point: string | null;
  is_combo: boolean;
  combo_drink: string | null;
  additionals: { id: string; name: string; price: number }[];
  subtotal: number;
}

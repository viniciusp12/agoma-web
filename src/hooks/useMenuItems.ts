import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, type DBMenuItem } from '../services/supabase';
import { MENU_ITEMS } from '../data/menu';
import type { MenuItem } from '../types';

/** Converte linha do Supabase → MenuItem usado pelos componentes */
function toMenuItem(row: DBMenuItem): MenuItem {
  return {
    id:             row.external_id || row.id,
    name:           row.name,
    description:    row.description ?? '',
    price:          Number(row.price),
    category:       row.category as MenuItem['category'],
    image:          row.image_url ?? undefined,
    badge:          row.badge ?? undefined,
    hasMeatPoint:   row.has_meat_point,
    canBeCombo:     row.can_be_combo,
    maxAdditionals: row.max_additionals,
  };
}

interface UseMenuItemsResult {
  items: MenuItem[];
  loading: boolean;
}

// Canal único por instância para evitar conflito quando o hook é usado em vários componentes
let instanceCounter = 0;

const SUPABASE_CONFIGURED =
  !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);

export function useMenuItems(): UseMenuItemsResult {
  const [items, setItems]     = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const channelId             = useRef(`menu_items_rt_${++instanceCounter}`);

  const fetchItems = useCallback(async () => {
    // Sem Supabase configurado → usa dados estáticos imediatamente
    if (!SUPABASE_CONFIGURED) {
      setItems(MENU_ITEMS);
      setLoading(false);
      return;
    }

    try {
      // Timeout de 8 segundos para não ficar carregando indefinidamente
      const timeoutId = setTimeout(() => {
        setItems(MENU_ITEMS);
        setLoading(false);
      }, 8000);

      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('active', true)
        .order('category')
        .order('display_order');

      clearTimeout(timeoutId);

      if (error || !data) {
        console.warn('[useMenuItems] Falha ao buscar do Supabase, usando dados estáticos:', error?.message);
        setItems(MENU_ITEMS);
      } else {
        setItems((data as DBMenuItem[]).map(toMenuItem));
      }
    } catch (err) {
      console.warn('[useMenuItems] Erro inesperado, usando dados estáticos:', err);
      setItems(MENU_ITEMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();

    if (!SUPABASE_CONFIGURED) return;

    // Realtime: qualquer alteração na tabela → rebusca os itens
    const channel = supabase
      .channel(channelId.current)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'menu_items' },
        () => { fetchItems(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchItems]);

  return { items, loading };
}

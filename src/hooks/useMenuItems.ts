import { useEffect, useState, useCallback } from 'react';
import { supabase, type DBMenuItem } from '../services/supabase';
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

export function useMenuItems(): UseMenuItemsResult {
  const [items, setItems]     = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .eq('active', true)
      .order('category')
      .order('display_order');
    if (data) setItems((data as DBMenuItem[]).map(toMenuItem));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();

    // Realtime: qualquer alteração na tabela → rebusca os itens
    const channel = supabase
      .channel('menu_items_realtime')
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

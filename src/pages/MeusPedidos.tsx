import { useEffect, useState } from 'react';
import { Clock, Package, Bike, PartyPopper, ChefHat, XCircle, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase, type DBOrder, type DBOrderItem } from '../services/supabase';

type OrderWithItems = DBOrder & { order_items: DBOrderItem[] };

const STEPS = [
  { key: 'pending',          label: 'Pedido recebido',   icon: Clock       },
  { key: 'preparing',        label: 'Em preparo',        icon: ChefHat     },
  { key: 'out_for_delivery', label: 'Saiu para entrega', icon: Bike        },
  { key: 'delivered',        label: 'Entregue!',         icon: PartyPopper },
];

const STATUS_IDX: Record<string, number> = {
  pending: 0, preparing: 1, out_for_delivery: 2, delivered: 3,
};

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function MeusPedidos() {
  const [orders, setOrders]     = useState<OrderWithItems[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const ids: string[] = JSON.parse(localStorage.getItem('agoma_order_ids') ?? '[]');
    if (ids.length === 0) { setLoading(false); return; }

    async function loadOrders(silent: boolean) {
      if (!silent) setLoading(true);
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .in('id', ids)
        .order('created_at', { ascending: false });
      if (data) setOrders(data as OrderWithItems[]);
      if (!silent) setLoading(false);
    }

    // Carga inicial
    loadOrders(false);

    // Realtime — atualiza status (UPDATE) e remove (DELETE) ao vivo
    const channel = supabase
      .channel('meus_pedidos_realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updated = payload.new as DBOrder;
          if (ids.includes(updated.id)) {
            setOrders(prev => prev.map(o =>
              o.id === updated.id ? { ...o, ...updated } : o
            ));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'orders' },
        (payload) => {
          const deletedId = (payload.old as { id?: string })?.id;
          if (deletedId) {
            setOrders(prev => prev.filter(o => o.id !== deletedId));
          }
        }
      )
      .subscribe();

    // Polling a cada 8 s como fallback (garante atualização mesmo sem realtime)
    const timer = setInterval(() => loadOrders(true), 8_000);

    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center">
        <RefreshCw className="animate-spin text-[#1A2E17]" size={32} />
      </div>
    );
  }

  /* ── Empty ── */
  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex flex-col items-center justify-center gap-4 p-6 text-center">
        <Package size={60} className="text-[#1A2E17]/20" />
        <h1
          className="text-2xl font-black text-[#1A2E17]"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Nenhum pedido ainda
        </h1>
        <p className="text-gray-500 text-sm">
          Seus pedidos aparecerão aqui após você finalizar pelo site.
        </p>
      </div>
    );
  }

  /* ── List ── */
  return (
    <div className="min-h-screen bg-[#F5F0E6] px-4 py-8">
      <div className="max-w-lg mx-auto">

        {/* Title */}
        <h1
          className="text-2xl font-black text-[#1A2E17] mb-2"
          style={{ fontFamily: "'Playfair Display', serif" }}
        >
          Meus Pedidos
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          {orders.length} {orders.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
        </p>

        {/* Cards */}
        <div className="flex flex-col gap-4">
          {orders.map(order => {
            const isCancelled = order.status === 'cancelled';
            const isDelivered = order.status === 'delivered';
            const isExpanded  = expanded === order.id;
            const stepIdx     = STATUS_IDX[order.status] ?? 0;

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-sm border border-[#E2DAC8] overflow-hidden"
              >
                {/* Card header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="font-bold text-[#1A1A1A] text-sm">{formatDateTime(order.created_at)}</p>
                      <p className="text-gray-400 text-xs mt-0.5">
                        {order.order_items?.length ?? 0}{' '}
                        {(order.order_items?.length ?? 0) === 1 ? 'item' : 'itens'}
                        {order.customer_name ? ` · ${order.customer_name}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-black text-[#1A2E17] text-sm">{formatCurrency(Number(order.total))}</p>
                      {isCancelled ? (
                        <span className="text-xs font-bold text-red-500 flex items-center gap-1 justify-end mt-1">
                          <XCircle size={11} /> Cancelado
                        </span>
                      ) : isDelivered ? (
                        <span className="text-xs font-bold text-green-600 mt-1 block">✓ Entregue</span>
                      ) : (
                        <span className="text-xs font-bold text-[#C4A044] mt-1 block">• Em andamento</span>
                      )}
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="flex flex-col gap-0.5 mb-3">
                    {order.order_items?.slice(0, 2).map((oi, i) => (
                      <p key={i} className="text-xs text-gray-600 truncate">
                        {oi.quantity}× {oi.item_name}
                        {oi.notes && (
                          <span className="text-[#1A2E17] italic"> — {oi.notes}</span>
                        )}
                      </p>
                    ))}
                    {(order.order_items?.length ?? 0) > 2 && (
                      <p className="text-xs text-gray-400">
                        +{order.order_items.length - 2} itens
                      </p>
                    )}
                  </div>

                  {/* Motivo do cancelamento */}
                  {isCancelled && order.cancel_reason && (
                    <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
                      <p className="text-xs text-red-600">
                        <span className="font-semibold">Motivo do cancelamento:</span> {order.cancel_reason}
                      </p>
                    </div>
                  )}

                  {/* Toggle button (apenas se não cancelado) */}
                  {!isCancelled && (
                    <button
                      onClick={() => setExpanded(isExpanded ? null : order.id)}
                      className="w-full flex items-center justify-center gap-1 text-xs font-bold text-[#C4A044] hover:text-[#D4B558] py-2 border border-[#C4A044]/30 hover:border-[#C4A044]/60 rounded-xl transition-all"
                    >
                      {isExpanded ? (
                        <><ChevronUp size={13} /> Ocultar status</>
                      ) : (
                        <><ChevronDown size={13} /> Ver status do pedido</>
                      )}
                    </button>
                  )}
                </div>

                {/* Status tracker expandido */}
                {isExpanded && !isCancelled && (
                  <div className="border-t border-[#E2DAC8] bg-[#F9F6EF] px-5 py-4">
                    <div className="flex flex-col gap-3">
                      {STEPS.map((step, idx) => {
                        const Icon   = step.icon;
                        const done   = idx < stepIdx;
                        const active = idx === stepIdx;
                        return (
                          <div key={step.key} className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                                done   ? 'bg-green-500 text-white' :
                                active ? 'bg-[#C4A044] text-white shadow-md scale-110' :
                                         'bg-gray-200 text-gray-400'
                              }`}
                            >
                              <Icon size={16} />
                            </div>
                            <p
                              className={`flex-1 text-sm font-bold ${
                                done   ? 'text-green-600' :
                                active ? 'text-[#C4A044]' :
                                         'text-gray-400'
                              }`}
                            >
                              {step.label}
                            </p>
                            {active && (
                              <span className="text-[0.6rem] font-black bg-[#C4A044] text-white px-2 py-0.5 rounded-full uppercase tracking-wide">
                                Agora
                              </span>
                            )}
                            {done && (
                              <span className="text-xs font-bold text-green-500">✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

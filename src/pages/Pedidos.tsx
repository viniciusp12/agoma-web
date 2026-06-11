import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, ShoppingBag, ArrowLeft, Clock, ChefHat, Bike, PartyPopper } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { supabase } from '../services/supabase';

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatMeat(point?: string) {
  if (!point) return '';
  return { mal_passado: 'Mal passado', ao_ponto: 'Ao ponto', bem_passado: 'Bem passado' }[point] ?? '';
}

// ── Etapas do rastreamento ─────────────────────────────────────────────────
const STEPS = [
  { key: 'pending',          label: 'Pedido recebido',    icon: Clock,       desc: 'Aguardando confirmação da loja' },
  { key: 'preparing',        label: 'Em preparo',         icon: ChefHat,     desc: 'Seu pedido está sendo preparado' },
  { key: 'out_for_delivery', label: 'Saiu para entrega',  icon: Bike,        desc: 'O entregador está a caminho' },
  { key: 'delivered',        label: 'Entregue!',          icon: PartyPopper, desc: 'Bom apetite! 🎉' },
] as const;

const STATUS_INDEX: Record<string, number> = {
  pending: 0, preparing: 1, out_for_delivery: 2, delivered: 3,
};

export default function Pedidos() {
  const { state, clearCart, totalPrice } = useCart();
  const { items, address } = state;
  const navigate = useNavigate();

  const [orderStatus, setOrderStatus] = useState<string>('pending');
  const [cancelled, setCancelled]     = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);

    const orderId = localStorage.getItem('agoma_last_order_id');
    if (!orderId) return;

    // Busca status atual
    supabase.from('orders').select('status').eq('id', orderId).single()
      .then(({ data }) => {
        if (data?.status === 'cancelled') setCancelled(true);
        else if (data?.status) setOrderStatus(data.status);
      });

    // Realtime — atualiza status assim que o admin muda
    const channel = supabase
      .channel(`order_track_${orderId}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        ({ new: row }) => {
          if (row.status === 'cancelled') setCancelled(true);
          else setOrderStatus(row.status as string);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  function handleVoltar() {
    clearCart();
    localStorage.removeItem('agoma_last_order_id');
    navigate('/');
  }

  const currentStep = STATUS_INDEX[orderStatus] ?? 0;

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <CheckCircle size={64} className="text-[#1A2E17] mb-4" strokeWidth={1.5} />
          <h1 className="text-3xl font-black text-[#1A1A1A] mb-2"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Pedido Realizado!
          </h1>
          <p className="text-gray-500 text-sm">Acompanhe abaixo o status do seu pedido em tempo real.</p>
        </div>

        {/* ── Tracker de status ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-5 mb-6">
          <h2 className="font-bold text-[#1A1A1A] mb-5 text-sm">Status do Pedido</h2>

          {cancelled ? (
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <span className="text-2xl">❌</span>
              <div>
                <p className="font-bold text-red-700 text-sm">Pedido cancelado</p>
                <p className="text-xs text-red-500">Entre em contato conosco se precisar de ajuda.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                const done    = i < currentStep;
                const active  = i === currentStep;
                const pending = i > currentStep;
                return (
                  <div key={step.key} className="flex gap-4">
                    {/* Linha vertical + ícone */}
                    <div className="flex flex-col items-center">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all ${
                        done   ? 'bg-[#1A2E17]' :
                        active ? 'bg-[#C4A044]' :
                                 'bg-gray-100'
                      }`}>
                        <Icon size={17} className={done || active ? 'text-white' : 'text-gray-400'} />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 mt-1 transition-all ${done ? 'bg-[#1A2E17]' : 'bg-gray-100'}`} />
                      )}
                    </div>
                    {/* Texto */}
                    <div className="pb-6 pt-1.5">
                      <p className={`text-sm font-bold ${active ? 'text-[#C4A044]' : done ? 'text-[#1A2E17]' : 'text-gray-300'}`}>
                        {step.label}
                        {active && <span className="ml-2 text-[0.6rem] bg-[#C4A044] text-white px-1.5 py-0.5 rounded-full uppercase tracking-wide font-bold">Agora</span>}
                      </p>
                      {(active || done) && !pending && (
                        <p className="text-xs text-gray-400 mt-0.5">{step.desc}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Resumo do pedido */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
            <ShoppingBag size={18} className="text-[#1A2E17]" />
            <h2 className="font-bold text-[#1A1A1A]">Resumo do Pedido</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {items.map((ci) => {
              const addPrice = ci.additionals.reduce((s, a) => s + a.price, 0);
              const combo = ci.isCombo ? 16 : 0;
              const unit = ci.item.price + addPrice + combo;
              return (
                <div key={ci.cartId} className="flex gap-4 px-6 py-4">
                  {ci.item.image ? (
                    <img src={ci.item.image} alt={ci.item.name}
                      className="w-14 h-14 object-cover rounded-xl shrink-0" />
                  ) : (
                    <div className="w-14 h-14 bg-[#EDE6D8] rounded-xl shrink-0 flex items-center justify-center text-2xl">🍔</div>
                  )}
                  <div className="flex-1">
                    <p className="font-bold text-[#1A1A1A] text-sm">
                      {ci.item.name} <span className="text-gray-400 font-normal">x{ci.quantity}</span>
                    </p>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      {ci.meatPoint && <p>• {formatMeat(ci.meatPoint)}</p>}
                      {ci.isCombo && <p>• 🔥 Combo{ci.comboDrink ? ` — ${ci.comboDrink}` : ''}</p>}
                      {ci.additionals.map((a) => <p key={a.id}>• + {a.name}</p>)}
                      {ci.observations && <p className="text-[#1A2E17] italic mt-0.5">📝 {ci.observations}</p>}
                    </div>
                  </div>
                  <p className="font-bold text-[#1A2E17] text-sm shrink-0">{formatCurrency(unit * ci.quantity)}</p>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between px-6 py-4 bg-[#1A2E17]/5 border-t border-[#1A2E17]/10">
            <span className="font-bold text-[#1A1A1A]">Total</span>
            <span className="text-xl font-black text-[#1A2E17]">{formatCurrency(totalPrice)}</span>
          </div>
        </div>

        {/* Endereço */}
        {address && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-6 py-4 mb-6">
            <h3 className="font-bold text-[#1A1A1A] mb-2 text-sm">📍 Endereço de entrega</h3>
            <p className="text-sm text-gray-600">{address.street}, {address.number}{address.complement ? ` - ${address.complement}` : ''}</p>
            <p className="text-sm text-gray-600">{address.neighborhood}, {address.city} - {address.state}</p>
            {address.reference && <p className="text-sm text-gray-400 mt-1">Ref: {address.reference}</p>}
          </div>
        )}

        <button onClick={handleVoltar}
          className="w-full flex items-center justify-center gap-2 bg-[#1A2E17] hover:bg-[#243d20] text-white font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5">
          <ArrowLeft size={18} />
          Voltar ao início
        </button>
      </div>
    </div>
  );
}

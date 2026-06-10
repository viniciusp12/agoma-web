import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { supabase } from '../services/supabase';
import {
  CheckCircle, ChevronLeft, MapPin, ShoppingBag,
  QrCode, CreditCard, Loader2, Copy, Check, X
} from 'lucide-react';

declare global {
  interface Window { MercadoPago: any; }
}

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type PaymentStatus = 'idle' | 'loading_pix' | 'loading_card' | 'pix' | 'card' | 'success' | 'error';

export default function Pagamento() {
  const navigate = useNavigate();
  const { state, totalPrice, clearCart } = useCart();
  const { items, address } = state;

  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [pixCode, setPixCode] = useState('');
  const [pixQr, setPixQr] = useState('');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [mpReady, setMpReady] = useState(false);

  /* SDK Mercado Pago */
  useEffect(() => {
    if (document.getElementById('mp-sdk')) { setMpReady(true); return; }
    const s = document.createElement('script');
    s.id = 'mp-sdk';
    s.src = 'https://sdk.mercadopago.com/js/v2';
    s.onload = () => setMpReady(true);
    document.head.appendChild(s);
  }, []);

  /* Redireciona se carrinho vazio */
  useEffect(() => {
    if (items.length === 0 && status !== 'success') navigate('/', { replace: true });
  }, [items, navigate, status]);

  /* Salva pedido no Supabase */
  const saveOrder = useCallback(async (): Promise<string | null> => {
    const addr = address
      ? `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''}, ${address.neighborhood}, ${address.city} - ${address.state}, CEP: ${address.cep}`
      : 'Retirada no local';

    const { data: order, error } = await supabase
      .from('orders')
      .insert({ total: totalPrice, address: addr, status: 'pending' })
      .select()
      .single();

    if (error || !order) return null;

    const orderItems = items.map(ci => ({
      order_id: order.id,
      item_name: ci.item.name,
      item_price: ci.item.price,
      quantity: ci.quantity,
      meat_point: ci.meatPoint ?? null,
      is_combo: ci.isCombo,
      combo_drink: ci.comboDrink ?? null,
      additionals: ci.additionals.map(a => a.name).join(', '),
      subtotal: (ci.item.price + (ci.isCombo ? 16 : 0) + ci.additionals.reduce((s, a) => s + a.price, 0)) * ci.quantity,
    }));

    const { error: e2 } = await supabase.from('order_items').insert(orderItems);
    if (e2) return null;

    return order.id as string;
  }, [items, totalPrice, address]);

  /* PIX */
  async function handlePix() {
    setStatus('loading_pix'); setErrorMsg('');
    const id = await saveOrder();
    if (!id) { setErrorMsg('Erro ao registrar pedido.'); setStatus('error'); return; }
    setOrderId(id);

    try {
      const res = await fetch('/api/pagamento/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: id, amount: totalPrice, description: `Pedido AGOMA #${id.slice(0, 8)}` }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setPixCode(data.qr_code);
      setPixQr(data.qr_code_base64);
      setStatus('pix');
    } catch {
      setErrorMsg('Não foi possível gerar o PIX. Verifique as credenciais do Mercado Pago.');
      setStatus('error');
    }
  }

  /* Cartão */
  async function handleCard() {
    if (!mpReady) return;
    setStatus('loading_card'); setErrorMsg('');
    const id = await saveOrder();
    if (!id) { setErrorMsg('Erro ao registrar pedido.'); setStatus('error'); return; }
    setOrderId(id);
    setStatus('card');

    const mp = new window.MercadoPago(import.meta.env.VITE_MP_PUBLIC_KEY, { locale: 'pt-BR' });
    const bricks = mp.bricks();

    await bricks.create('payment', 'mp-card-form', {
      initialization: { amount: totalPrice },
      customization: {
        visual: {
          style: {
            theme: 'default',
            customVariables: {
              textPrimaryColor: '#1A2E17',
              inputBackgroundColor: '#FAFAF8',
              baseColor: '#C4A044',
              borderRadiusLarge: '12px',
            },
          },
          hideFormTitle: true,
        },
        paymentMethods: { creditCard: 'all', debitCard: 'all' },
      },
      callbacks: {
        onReady: () => {},
        onSubmit: async ({ formData }: any) => {
          try {
            const res = await fetch('/api/pagamento/cartao', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...formData, order_id: id }),
            });
            const result = await res.json();
            if (result.status === 'approved') {
              await supabase.from('orders').update({ status: 'confirmed' }).eq('id', id);
              clearCart(); setStatus('success');
            } else {
              setErrorMsg('Pagamento não aprovado. Tente outro método.');
              setStatus('error');
            }
          } catch { setErrorMsg('Erro ao processar cartão.'); setStatus('error'); }
        },
        onError: () => { setErrorMsg('Erro no formulário de cartão.'); setStatus('error'); },
      },
    });
  }

  async function copyPix() {
    await navigator.clipboard.writeText(pixCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function confirmPixPayment() {
    if (!orderId) return;
    const { data } = await supabase.from('orders').select('status').eq('id', orderId).single();
    if (data?.status === 'confirmed') { clearCart(); setStatus('success'); return; }
    // Para testes: confirma manualmente
    await supabase.from('orders').update({ status: 'confirmed' }).eq('id', orderId);
    clearCart();
    setStatus('success');
  }

  /* ── SUCESSO ────────────────────────────────────────────── */
  if (status === 'success') return (
    <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-10 max-w-md w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-green-100 rounded-full p-5">
            <CheckCircle size={52} className="text-green-600" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-[#1A2E17] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
          Pedido confirmado!
        </h1>
        <p className="text-gray-500 mb-8 text-sm leading-relaxed">
          Recebemos seu pagamento com sucesso.<br />
          Seu pedido já está sendo preparado com carinho.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full bg-[#1A2E17] hover:bg-[#243d1f] text-white font-bold py-4 rounded-2xl transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    </div>
  );

  /* ── TELA PRINCIPAL ─────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#F5F0E6]">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-[#1A2E17] shadow-lg">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white transition-colors p-1">
            <ChevronLeft size={22} />
          </button>
          <img src="/assets/logo/logo-light.png" alt="AGOMA." className="h-7 w-auto brightness-0 invert opacity-90" />
          <div>
            <p className="text-white font-bold text-base tracking-wide leading-none" style={{ fontFamily: "'Playfair Display', serif" }}>
              AGOMA.
            </p>
            <p className="text-[#C4A044] text-[0.55rem] tracking-widest uppercase font-semibold">street food na ladeira</p>
          </div>
          <span className="ml-auto text-white/60 text-sm font-medium">Pagamento</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">

        {/* Resumo do pedido */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
            <ShoppingBag size={18} className="text-[#1A2E17]" />
            <h2 className="text-base font-bold text-[#1A2E17]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Resumo do pedido
            </h2>
          </div>
          <div className="px-5 py-3 space-y-3 max-h-52 overflow-y-auto">
            {items.map(ci => {
              const extras = (ci.isCombo ? 16 : 0) + ci.additionals.reduce((s, a) => s + a.price, 0);
              const sub = (ci.item.price + extras) * ci.quantity;
              return (
                <div key={ci.cartId} className="flex justify-between items-start gap-2 text-sm">
                  <div className="flex-1">
                    <p className="font-semibold text-[#1A1A1A]">
                      {ci.quantity}× {ci.item.name}
                      {ci.isCombo && (
                        <span className="ml-1.5 text-[10px] font-bold bg-[#C4A044]/20 text-[#C4A044] px-1.5 py-0.5 rounded-full uppercase">combo</span>
                      )}
                    </p>
                    {ci.meatPoint && <p className="text-gray-400 text-xs">{{ mal_passado: 'Mal passado', ao_ponto: 'Ao ponto', bem_passado: 'Bem passado' }[ci.meatPoint]}</p>}
                    {ci.additionals.length > 0 && <p className="text-gray-400 text-xs">+ {ci.additionals.map(a => a.name).join(', ')}</p>}
                    {ci.comboDrink && <p className="text-gray-400 text-xs">Bebida: {ci.comboDrink}</p>}
                  </div>
                  <p className="font-bold text-[#1A2E17] whitespace-nowrap">{formatCurrency(sub)}</p>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-4 border-t border-gray-100 flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-xl font-black text-[#1A2E17]">{formatCurrency(totalPrice)}</span>
          </div>
        </div>

        {/* Endereço */}
        {address && (
          <div className="bg-white rounded-2xl shadow-sm px-5 py-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="text-[#C4A044] mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-[#1A2E17] uppercase tracking-wider mb-1">Entrega em</p>
                <p className="text-sm text-gray-600">
                  {address.street}, {address.number}{address.complement ? ` - ${address.complement}` : ''}<br />
                  {address.neighborhood}, {address.city} - {address.state}, CEP {address.cep}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Métodos de pagamento */}
        {(status === 'idle' || status === 'error') && (
          <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
            <h3 className="font-bold text-[#1A2E17] text-sm mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
              Escolha o método de pagamento
            </h3>
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-start gap-2">
                <X size={16} className="text-red-600 shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">{errorMsg}</p>
              </div>
            )}
            <button
              onClick={handlePix}
              disabled={status === 'loading_pix'}
              className="w-full bg-[#00BBDC] hover:bg-[#00A3C4] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading_pix' ? <Loader2 size={18} className="animate-spin" /> : <QrCode size={18} />}
              Pagar com PIX
            </button>
            <button
              onClick={handleCard}
              disabled={!mpReady || status === 'loading_card'}
              className="w-full bg-[#1A2E17] hover:bg-[#243d1f] text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {status === 'loading_card' ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
              Pagar com Cartão
            </button>
          </div>
        )}

        {/* Tela PIX */}
        {status === 'pix' && (
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center space-y-4">
            <QrCode size={48} className="text-[#00BBDC]" />
            <h3 className="font-bold text-lg text-[#1A2E17]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Pague com PIX
            </h3>
            <p className="text-sm text-gray-500 text-center">
              Escaneie o QR Code abaixo ou copie o código PIX para finalizar o pagamento.
            </p>
            {pixQr && (
              <div className="bg-white p-4 rounded-xl border-2 border-gray-200">
                <img src={`data:image/png;base64,${pixQr}`} alt="QR Code PIX" className="w-56 h-56" />
              </div>
            )}
            <div className="w-full bg-gray-50 rounded-xl px-4 py-3 text-xs font-mono text-gray-700 break-all">
              {pixCode}
            </div>
            <button
              onClick={copyPix}
              className="w-full bg-[#00BBDC] hover:bg-[#00A3C4] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Código copiado!' : 'Copiar código PIX'}
            </button>
            <button
              onClick={confirmPixPayment}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all"
            >
              Já paguei — Confirmar pedido
            </button>
            <button onClick={() => setStatus('idle')} className="text-sm text-gray-500 underline">
              Voltar
            </button>
          </div>
        )}

        {/* Tela Cartão */}
        {status === 'card' && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div id="mp-card-form"></div>
            <button onClick={() => setStatus('idle')} className="mt-4 text-sm text-gray-500 underline w-full text-center">
              Voltar
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

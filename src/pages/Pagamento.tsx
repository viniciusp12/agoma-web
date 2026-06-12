import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  QrCode,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Loader2,
  ShoppingBag,
} from 'lucide-react';
import { supabase } from '../services/supabase';

// ── Tipos ──────────────────────────────────────────────────────────────────
type PaymentMethod = 'credit_card' | 'pix';

type MPPaymentStatus =
  | 'pending'
  | 'approved'
  | 'authorized'
  | 'in_process'
  | 'in_mediation'
  | 'rejected'
  | 'cancelled'
  | 'refunded'
  | 'charged_back';

interface MPPaymentResponse {
  id: number;
  status: MPPaymentStatus;
  status_detail: string;
  transaction_amount: number;
  description: string;
  payment_method_id: string;
  payment_type_id: string;
  date_created: string;
  date_approved: string | null;
  payer: {
    email: string;
    first_name?: string;
    last_name?: string;
  };
  point_of_interaction?: {
    transaction_data?: {
      qr_code?: string;
      qr_code_base64?: string;
    };
  };
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const STATUS_CONFIG: Record<MPPaymentStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'Pendente', color: 'text-[#C4A044]', icon: Clock },
  approved: { label: 'Aprovado', color: 'text-green-600', icon: CheckCircle2 },
  authorized: { label: 'Autorizado', color: 'text-green-600', icon: CheckCircle2 },
  in_process: { label: 'Processando', color: 'text-[#C4A044]', icon: Loader2 },
  in_mediation: { label: 'Em mediação', color: 'text-orange-500', icon: Clock },
  rejected: { label: 'Rejeitado', color: 'text-red-600', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'text-red-600', icon: XCircle },
  refunded: { label: 'Estornado', color: 'text-gray-500', icon: ArrowLeft },
  charged_back: { label: 'Chargeback', color: 'text-red-700', icon: XCircle },
};

// ── Componente principal ───────────────────────────────────────────────────
export default function Pagamento() {
  const navigate = useNavigate();
  const [method, setMethod] = useState<PaymentMethod>('pix');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Snapshot do checkout (vindo do CartDrawer)
  const [checkoutData, setCheckoutData] = useState<any>(null);

  // Dados do cartão
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerCpf, setPayerCpf] = useState('');

  // Resposta do Mercado Pago
  const [payment, setPayment] = useState<MPPaymentResponse | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [statusData, setStatusData] = useState<MPPaymentResponse | null>(null);

  // Carrega snapshot
  useEffect(() => {
    const raw = localStorage.getItem('agoma_checkout_snapshot');
    if (raw) {
      try {
        setCheckoutData(JSON.parse(raw));
      } catch {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  // Polling de status
  useEffect(() => {
    if (!paymentId) return;
    const interval = setInterval(() => fetchPaymentStatus(paymentId), 5_000);
    return () => clearInterval(interval);
  }, [paymentId]);

  // ── Consulta status pelo ID ──────────────────────────────────────────────
  async function fetchPaymentStatus(id: string) {
    try {
      const res = await fetch(`/api/mercadopago/payments/${id}`);
      if (!res.ok) return;
      const data: MPPaymentResponse = await res.json();
      setStatusData(data);
      // Se aprovado, cria o pedido e redireciona
      if ((data.status === 'approved' || data.status === 'authorized') && checkoutData) {
        await saveOrder();
        clearInterval(undefined);
      }
    } catch {
      // silencia erros de polling
    }
  }

  // ── Salva pedido no Supabase após aprovação ────────────────────────────
  async function saveOrder() {
    if (!checkoutData) return;
    try {
      const { data: order } = await supabase
        .from('orders')
        .insert([{
          total: checkoutData.total,
          address: checkoutData.address,
          status: 'pending',
          customer_name: checkoutData.customerName?.trim() || null,
        }])
        .select()
        .single();
      if (order) {
        const orderItems = checkoutData.items.map((ci: any) => {
          let extrasTotal = 0;
          if (ci.extras && ci.extras.length > 0) {
            extrasTotal = ci.extras.reduce((sum: number, ex: any) => sum + (ex.price ?? 0), 0);
          }
          const itemTotal = (ci.item.price + extrasTotal) * ci.quantity;
          return {
            order_id: order.id,
            item_id: ci.item.id,
            quantity: ci.quantity,
            unit_price: ci.item.price,
            total_price: itemTotal,
            meat_point: ci.meat ?? null,
            extras: ci.extras || [],
          };
        });
        await supabase.from('order_items').insert(orderItems);
        localStorage.setItem('agoma_last_order_id', order.id);
        localStorage.setItem(
          'agoma_last_order_snapshot',
          JSON.stringify({ items: checkoutData.items, address: checkoutData.address, total: checkoutData.total }),
        );
        localStorage.removeItem('agoma_checkout_snapshot');
        navigate('/pedidos');
      }
    } catch (err) {
      console.error('Erro ao salvar pedido:', err);
    }
  }

  // ── Cria pagamento ───────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checkoutData) return;
    setLoading(true);
    setError(null);

    const body: Record<string, unknown> = {
      transaction_amount: checkoutData.total,
      description: `Pedido Agomá — ${checkoutData.items.length} item(s)`,
      payment_method_id: method === 'pix' ? 'pix' : 'visa',
      payer: {
        email: payerEmail,
        first_name: cardName.split(' ')[0] || 'Cliente',
        last_name: cardName.split(' ').slice(1).join(' ') || 'Agomá',
        identification: { type: 'CPF', number: payerCpf.replace(/\D/g, '') },
      },
    };

    if (method === 'credit_card') {
      // Em produção, use MercadoPago.js para tokenizar o cartão
      body.token = '__CARD_TOKEN__';
      body.installments = 1;
      body.issuer_id = undefined;
    }

    try {
      const res = await fetch('/api/mercadopago/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
        const text = await res.text();
          if (!text || text.trim() === '') {
                  throw new Error('O servidor não retornou resposta. Verifique a configuração da API do Mercado Pago.');
                }
          let data: MPPaymentResponse;
          try {
                  data = JSON.parse(text);
                } catch {
                  throw new Error(`Resposta inválida do servidor: ${text.slice(0, 150)}`);
                }
      if (!res.ok) {
        throw new Error(data?.status_detail ?? 'Erro ao processar pagamento');
      }
      setPayment(data);
      setPaymentId(String(data.id));
      setStatusData(data);
    } catch (err: unknown) {
      setError((err as Error).message ?? 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  // ── Helpers de formatação ────────────────────────────────────────────────
  function fmtCard(v: string) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})/g, '$1 ').trim();
  }
  function fmtExpiry(v: string) {
    return v.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(\d)/, '$1/$2');
  }
  function fmtCpf(v: string) {
    return v.replace(/\D/g, '').slice(0, 11)
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  const currentStatus = statusData ?? payment;
  const statusCfg = currentStatus ? STATUS_CONFIG[currentStatus.status] : null;

  if (!checkoutData) return null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#FAF7F2] py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:border-[#1A2E17] transition-all"
            aria-label="Voltar"
          >
            <ArrowLeft size={16} className="text-[#1A2E17]" />
          </button>
          <div>
            <h1
              className="text-2xl font-black text-[#1A1A1A]"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Pagamento
            </h1>
            <p className="text-xs text-gray-400">Powered by Mercado Pago</p>
          </div>
        </div>

        {/* Resumo */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag size={16} className="text-[#1A2E17]" />
            <span className="font-bold text-sm text-[#1A1A1A]">Resumo do pedido</span>
          </div>
          {checkoutData.items.map((ci: any) => (
            <div key={ci.cartId} className="flex justify-between text-sm text-gray-600 mb-1">
              <span>{ci.item.name} <span className="text-gray-400">×{ci.quantity}</span></span>
              <span>{formatCurrency(ci.item.price * ci.quantity)}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 mt-3 pt-3 flex justify-between items-center">
            <span className="font-bold text-[#1A1A1A]">Total</span>
            <span className="text-xl font-black text-[#1A2E17]">{formatCurrency(checkoutData.total)}</span>
          </div>
        </div>

        {/* Status do pagamento (após criação) */}
        {currentStatus && statusCfg && (
          <div className={`bg-white rounded-2xl border shadow-sm px-6 py-5 mb-6 ${
            currentStatus.status === 'approved' || currentStatus.status === 'authorized'
              ? 'border-green-200' : 'border-gray-100'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <statusCfg.icon size={22} className={statusCfg.color} />
              <div>
                <p className={`font-bold text-sm ${statusCfg.color}`}>{statusCfg.label}</p>
                <p className="text-xs text-gray-400">ID: {currentStatus.id}</p>
              </div>
            </div>

            {/* PIX QR Code */}
            {method === 'pix' && currentStatus.point_of_interaction?.transaction_data?.qr_code_base64 && (
              <div className="flex flex-col items-center gap-3 mt-4">
                <img
                  src={`data:image/png;base64,${currentStatus.point_of_interaction.transaction_data.qr_code_base64}`}
                  alt="QR Code PIX"
                  className="w-44 h-44 rounded-xl border border-gray-100"
                />
                <p className="text-xs text-gray-500 text-center">Escaneie o QR Code no seu app de pagamento</p>
                {currentStatus.point_of_interaction.transaction_data.qr_code && (
                  <button
                    onClick={() => navigator.clipboard.writeText(
                      currentStatus!.point_of_interaction!.transaction_data!.qr_code!
                    )}
                    className="text-xs font-semibold text-[#1A2E17] underline underline-offset-2"
                  >
                    Copiar código PIX
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Formulário de pagamento (exibido antes de criar o pagamento) */}
        {!payment && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-6">
            {/* Seleção de método */}
            <p className="font-bold text-sm text-[#1A1A1A] mb-4">Método de pagamento</p>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {([
                { id: 'credit_card', label: 'Cartão', icon: CreditCard },
                { id: 'pix', label: 'PIX', icon: QrCode },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setMethod(id)}
                  className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border-2 text-xs font-bold transition-all ${
                    method === id
                      ? 'border-[#1A2E17] bg-[#1A2E17]/5 text-[#1A2E17]'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} />
                  {label}
                </button>
              ))}
            </div>

            {/* Campos comuns */}
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">E-mail do pagador</label>
                <input
                  type="email"
                  required
                  value={payerEmail}
                  onChange={e => setPayerEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1A2E17] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5">CPF</label>
                <input
                  type="text"
                  required
                  value={payerCpf}
                  onChange={e => setPayerCpf(fmtCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#1A2E17] transition-all"
                />
              </div>

              {/* Campos específicos do cartão */}
              {method === 'credit_card' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Número do cartão</label>
                    <input
                      type="text"
                      required
                      value={cardNumber}
                      onChange={e => setCardNumber(fmtCard(e.target.value))}
                      placeholder="0000 0000 0000 0000"
                      maxLength={19}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono tracking-widest focus:outline-none focus:border-[#1A2E17] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">Nome no cartão</label>
                    <input
                      type="text"
                      required
                      value={cardName}
                      onChange={e => setCardName(e.target.value.toUpperCase())}
                      placeholder="NOME SOBRENOME"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm uppercase tracking-wide focus:outline-none focus:border-[#1A2E17] transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">Validade</label>
                      <input
                        type="text"
                        required
                        value={cardExpiry}
                        onChange={e => setCardExpiry(fmtExpiry(e.target.value))}
                        placeholder="MM/AA"
                        maxLength={5}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1A2E17] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">CVV</label>
                      <input
                        type="text"
                        required
                        value={cardCvv}
                        onChange={e => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        placeholder="000"
                        maxLength={4}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#1A2E17] transition-all"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Erro */}
            {error && (
              <div className="mt-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <XCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
                <p className="text-xs text-red-600">{error}</p>
              </div>
            )}

            {/* Botão de pagamento */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-[#1A2E17] hover:bg-[#243d20] disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-all hover:-translate-y-0.5"
            >
              {loading ? (
                <><Loader2 size={18} className="animate-spin" /> Processando...</>
              ) : (
                <><CreditCard size={18} /> Pagar {formatCurrency(checkoutData.total)}</>
              )}
            </button>
            <p className="text-center text-xs text-gray-400 mt-3">
              Seus dados são protegidos pelo Mercado Pago 🔒
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

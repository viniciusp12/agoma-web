import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Calendar,
  MapPin, ShoppingBag, RefreshCw, DollarSign, Trophy,
} from 'lucide-react';
import { supabase, type DBOrder } from '../../services/supabase';
import AdminLayout from '../../components/admin/AdminLayout';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const MONTHS_SHORT   = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

type Order = Pick<DBOrder, 'id' | 'total' | 'created_at' | 'status' | 'address'>;

// Percentual de crescimento entre dois valores
function growth(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

// ── Badge de crescimento/queda ───────────────────────────────────────────────
function GrowthBadge({ pct }: { pct: number }) {
  const up   = pct > 0.5;
  const down = pct < -0.5;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  const cls  = up
    ? 'bg-green-50 text-green-600'
    : down
    ? 'bg-red-50 text-red-500'
    : 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon size={12} />
      {pct > 0 ? '+' : ''}{pct.toFixed(0)}%
    </span>
  );
}

export default function AdminAnalytics() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  async function fetchOrders(silent = false) {
    if (!silent) setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('id, total, created_at, status, address')
      .order('created_at', { ascending: false })
      .limit(5000);
    setOrders((data as Order[]) ?? []);
    if (!silent) setLoading(false);
  }

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('admin_analytics_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders(true))
      .subscribe();

    const timer = setInterval(() => fetchOrders(true), 15_000);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Vendas válidas = exclui cancelados (não contam como faturamento)
  const sales = orders.filter(o => o.status !== 'cancelled');

  const now      = new Date();
  const curYear  = now.getFullYear();
  const curMonth = now.getMonth();

  // ── Períodos: hoje / semana (7 dias) / mês / ano ──
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 6);
  weekAgo.setHours(0, 0, 0, 0);

  const inToday = (d: Date) => sameDay(d, now);
  const inWeek  = (d: Date) => d >= weekAgo;
  const inMonth = (d: Date) => sameMonth(d, now);
  const inYear  = (d: Date) => d.getFullYear() === curYear;

  function periodStats(pred: (d: Date) => boolean) {
    const list = sales.filter(o => pred(new Date(o.created_at)));
    const revenue = list.reduce((s, o) => s + Number(o.total), 0);
    return { count: list.length, revenue };
  }

  const today = periodStats(inToday);
  const week  = periodStats(inWeek);
  const month = periodStats(inMonth);
  const year  = periodStats(inYear);

  // ── Comparação com o mês anterior ──
  const prevMonthDate = new Date(curYear, curMonth - 1, 1);
  const prevMonth = periodStats(d => sameMonth(d, prevMonthDate));

  const revGrowth   = growth(month.revenue, prevMonth.revenue);
  const salesGrowth = growth(month.count, prevMonth.count);

  const avgTicket = month.count ? month.revenue / month.count : 0;

  // ── Faturamento dos últimos 6 meses ──
  const monthsBack: { label: string; revenue: number; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const list = sales.filter(o => sameMonth(new Date(o.created_at), d));
    monthsBack.push({
      label: MONTHS_SHORT[d.getMonth()],
      revenue: list.reduce((s, o) => s + Number(o.total), 0),
      count: list.length,
    });
  }
  const maxMonthRev = Math.max(1, ...monthsBack.map(m => m.revenue));

  // ── Vendas dos últimos 7 dias ──
  const daysBack: { label: string; date: string; count: number; revenue: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const list = sales.filter(o => sameDay(new Date(o.created_at), d));
    daysBack.push({
      label: WEEKDAYS_SHORT[d.getDay()],
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      count: list.length,
      revenue: list.reduce((s, o) => s + Number(o.total), 0),
    });
  }
  const maxDayCount = Math.max(1, ...daysBack.map(d => d.count));

  // ── Bairros com mais entregas ──
  const bairroMap = new Map<string, number>();
  for (const o of sales) {
    const addr = o.address as Record<string, string> | null;
    const bairro = addr?.neighborhood?.trim();
    if (bairro) bairroMap.set(bairro, (bairroMap.get(bairro) ?? 0) + 1);
  }
  const topBairros = [...bairroMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxBairro = Math.max(1, ...topBairros.map(([, c]) => c));

  // ── KPIs principais ──
  const kpis = [
    { label: 'Faturamento hoje', value: formatCurrency(today.revenue), icon: DollarSign,  color: 'text-green-600',  bg: 'bg-green-50'     },
    { label: 'Faturamento no mês', value: formatCurrency(month.revenue), icon: TrendingUp, color: 'text-[#C4A044]', bg: 'bg-[#C4A044]/10', badge: revGrowth },
    { label: 'Vendas no mês',     value: month.count,                   icon: ShoppingBag, color: 'text-blue-600',  bg: 'bg-blue-50',      badge: salesGrowth },
    { label: 'Ticket médio',      value: formatCurrency(avgTicket),     icon: BarChart3,   color: 'text-[#1A2E17]', bg: 'bg-[#1A2E17]/10' },
  ];

  // ── Grid de períodos ──
  const periods = [
    { label: 'Hoje',         data: today },
    { label: 'Últimos 7 dias', data: week },
    { label: 'Este mês',     data: month },
    { label: 'Este ano',     data: year },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-[#1A2E17]"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Dashboard
            </h1>
            <p className="text-gray-500 text-sm">
              Visão geral de vendas, faturamento e desempenho
            </p>
          </div>
          <button onClick={() => fetchOrders()}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#C4A044] hover:text-[#1A2E17] bg-white border border-[#E2DAC8] px-3 py-2 rounded-xl transition-all">
            <RefreshCw size={13} /> Atualizar
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="animate-spin mx-auto text-[#1A2E17]" size={28} />
          </div>
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {kpis.map(({ label, value, icon: Icon, color, bg, badge }) => (
                <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DAC8]">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                      <Icon size={20} className={color} />
                    </div>
                    {badge !== undefined && <GrowthBadge pct={badge} />}
                  </div>
                  <p className="text-2xl font-black text-[#1A1A1A]">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Comparação com mês anterior */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DAC8] mb-6">
              <h2 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 text-sm">
                <TrendingUp size={16} className="text-[#C4A044]" />
                Comparação com o mês anterior
                <span className="text-gray-400 font-normal">
                  ({MONTHS_SHORT[(curMonth + 11) % 12]} → {MONTHS_SHORT[curMonth]})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Faturamento */}
                <div className="bg-[#F9F6EF] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Faturamento</p>
                  <div className="flex items-end gap-2">
                    <p className="text-xl font-black text-[#1A2E17]">{formatCurrency(month.revenue)}</p>
                    <GrowthBadge pct={revGrowth} />
                  </div>
                  <p className="text-[0.7rem] text-gray-400 mt-1">
                    Mês anterior: {formatCurrency(prevMonth.revenue)}
                  </p>
                </div>
                {/* Vendas */}
                <div className="bg-[#F9F6EF] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Vendas (pedidos)</p>
                  <div className="flex items-end gap-2">
                    <p className="text-xl font-black text-[#1A2E17]">{month.count}</p>
                    <GrowthBadge pct={salesGrowth} />
                  </div>
                  <p className="text-[0.7rem] text-gray-400 mt-1">
                    Mês anterior: {prevMonth.count} {prevMonth.count === 1 ? 'pedido' : 'pedidos'}
                  </p>
                </div>
              </div>
            </div>

            {/* Períodos: vendas + faturamento */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {periods.map(({ label, data }) => (
                <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2DAC8]">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">{label}</p>
                  <p className="text-lg font-black text-[#1A2E17]">{formatCurrency(data.revenue)}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {data.count} {data.count === 1 ? 'venda' : 'vendas'}
                  </p>
                </div>
              ))}
            </div>

            {/* Gráficos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

              {/* Faturamento — últimos 6 meses */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DAC8]">
                <h2 className="font-bold text-[#1A1A1A] mb-5 flex items-center gap-2 text-sm">
                  <BarChart3 size={16} className="text-[#1A2E17]" />
                  Faturamento — últimos 6 meses
                </h2>
                <div className="flex items-end justify-between gap-2 h-44">
                  {monthsBack.map((m, i) => {
                    const h = (m.revenue / maxMonthRev) * 100;
                    const isCurrent = i === monthsBack.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[0.6rem] font-bold text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {formatCurrency(m.revenue)}
                        </span>
                        <div className="w-full rounded-t-lg relative transition-all"
                          style={{
                            height: `${Math.max(h, 2)}%`,
                            background: isCurrent ? '#C4A044' : '#1A2E17',
                          }}
                        />
                        <span className="text-[0.65rem] font-semibold text-gray-500">{m.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vendas — últimos 7 dias */}
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DAC8]">
                <h2 className="font-bold text-[#1A1A1A] mb-5 flex items-center gap-2 text-sm">
                  <Calendar size={16} className="text-[#1A2E17]" />
                  Vendas — últimos 7 dias
                </h2>
                <div className="flex items-end justify-between gap-2 h-44">
                  {daysBack.map((d, i) => {
                    const h = (d.count / maxDayCount) * 100;
                    const isToday = i === daysBack.length - 1;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                        <span className="text-[0.65rem] font-bold text-gray-600">{d.count || ''}</span>
                        <div className="w-full rounded-t-lg transition-all"
                          style={{
                            height: `${Math.max(h, 2)}%`,
                            background: isToday ? '#C4A044' : '#2B4A26',
                          }}
                          title={`${d.date}: ${d.count} vendas · ${formatCurrency(d.revenue)}`}
                        />
                        <span className="text-[0.65rem] font-semibold text-gray-500">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bairros com mais entregas */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DAC8]">
              <h2 className="font-bold text-[#1A1A1A] mb-5 flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-[#C4A044]" />
                Bairros com mais entregas
              </h2>
              {topBairros.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  Ainda não há entregas com bairro registrado.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {topBairros.map(([bairro, count], i) => {
                    const w = (count / maxBairro) * 100;
                    return (
                      <div key={bairro} className="flex items-center gap-3">
                        <div className="w-6 flex justify-center">
                          {i === 0 ? (
                            <Trophy size={15} className="text-[#C4A044]" />
                          ) : (
                            <span className="text-xs font-bold text-gray-400">{i + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-semibold text-[#1A1A1A] truncate">{bairro}</span>
                            <span className="text-xs font-bold text-gray-500 shrink-0 ml-2">
                              {count} {count === 1 ? 'entrega' : 'entregas'}
                            </span>
                          </div>
                          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.max(w, 4)}%`,
                                background: i === 0 ? '#C4A044' : '#1A2E17',
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

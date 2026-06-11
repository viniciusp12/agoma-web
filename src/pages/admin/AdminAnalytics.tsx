import { useEffect, useState } from 'react';
import {
  TrendingUp, TrendingDown, Minus, BarChart3, Calendar,
  MapPin, ShoppingBag, RefreshCw, DollarSign, Trophy, XCircle, Filter, RotateCcw,
} from 'lucide-react';
import { supabase, type DBOrder } from '../../services/supabase';
import AdminLayout from '../../components/admin/AdminLayout';

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const MONTHS_SHORT   = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
// Data local no formato YYYY-MM-DD (para comparação de intervalo como string)
function localDateKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Order = Pick<DBOrder, 'id' | 'total' | 'created_at' | 'status' | 'address'>;

// Percentual de crescimento entre dois valores
function growth(curr: number, prev: number): number {
  if (prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev) * 100;
}

// ── Badge de crescimento/queda ───────────────────────────────────────────────
function GrowthBadge({ pct, invert = false }: { pct: number; invert?: boolean }) {
  const up   = pct > 0.5;
  const down = pct < -0.5;
  const Icon = up ? TrendingUp : down ? TrendingDown : Minus;
  // invert = quando subir é ruim (ex: cancelamentos)
  const good = invert ? down : up;
  const bad  = invert ? up : down;
  const cls  = good
    ? 'bg-green-50 text-green-600'
    : bad
    ? 'bg-red-50 text-red-500'
    : 'bg-gray-100 text-gray-500';
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>
      <Icon size={12} />
      {pct > 0 ? '+' : ''}{pct.toFixed(0)}%
    </span>
  );
}

const PRESETS = [
  { key: 'today', label: 'Hoje' },
  { key: 'week',  label: '7 dias' },
  { key: 'month', label: 'Este mês' },
  { key: 'year',  label: 'Este ano' },
  { key: 'all',   label: 'Tudo' },
];

export default function AdminAnalytics() {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Filtro de período (intervalo de datas) ──
  const todayKey = localDateKey(new Date());
  const monthStartKey = localDateKey(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [startStr, setStartStr] = useState<string>(monthStartKey); // '' = sem limite inicial
  const [endStr, setEndStr]     = useState<string>(todayKey);      // '' = sem limite final
  const [preset, setPreset]     = useState<string>('month');       // só para destacar o botão ativo
  const [monthSel, setMonthSel] = useState<string>('');            // input type=month

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

    // Realtime — atualiza a dashboard junto com os pedidos
    const channel = supabase
      .channel('admin_analytics_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchOrders(true))
      .subscribe();

    // Polling a cada 8 s como fallback (garante atualização mesmo sem realtime)
    const timer = setInterval(() => fetchOrders(true), 8_000);
    return () => {
      clearInterval(timer);
      supabase.removeChannel(channel);
    };
  }, []);

  // ── Aplicadores de filtro ──
  function applyPreset(p: string) {
    const now = new Date();
    if (p === 'today') { setStartStr(localDateKey(now)); setEndStr(localDateKey(now)); }
    else if (p === 'week') {
      const s = new Date(now); s.setDate(now.getDate() - 6);
      setStartStr(localDateKey(s)); setEndStr(localDateKey(now));
    }
    else if (p === 'month') {
      setStartStr(localDateKey(new Date(now.getFullYear(), now.getMonth(), 1)));
      setEndStr(localDateKey(now));
    }
    else if (p === 'year') {
      setStartStr(localDateKey(new Date(now.getFullYear(), 0, 1)));
      setEndStr(localDateKey(now));
    }
    else if (p === 'all') { setStartStr(''); setEndStr(''); }
    setPreset(p);
    setMonthSel('');
  }

  // Limpa o filtro e volta ao padrão (este mês)
  function clearFilter() {
    applyPreset('month');
  }

  function applyMonth(ym: string) {
    setMonthSel(ym);
    if (!ym) return;
    const [y, m] = ym.split('-').map(Number);
    const first = new Date(y, m - 1, 1);
    const last  = new Date(y, m, 0); // último dia do mês
    setStartStr(localDateKey(first));
    setEndStr(localDateKey(last));
    setPreset('month-' + ym);
  }

  // ── Filtragem por intervalo ──
  function inRange(iso: string) {
    const key = localDateKey(new Date(iso));
    if (startStr && key < startStr) return false;
    if (endStr && key > endStr) return false;
    return true;
  }

  const now      = new Date();
  const curYear  = now.getFullYear();
  const curMonth = now.getMonth();

  // ── Resumo do período selecionado ──
  const ordersInRange     = orders.filter(o => inRange(o.created_at));
  const salesInRange      = ordersInRange.filter(o => o.status !== 'cancelled');
  const cancelledInRange  = ordersInRange.filter(o => o.status === 'cancelled');

  const revenueInRange    = salesInRange.reduce((s, o) => s + Number(o.total), 0);
  const lostInRange       = cancelledInRange.reduce((s, o) => s + Number(o.total), 0);
  const countInRange      = salesInRange.length;
  const cancelledCount    = cancelledInRange.length;
  const avgTicket         = countInRange ? revenueInRange / countInRange : 0;
  const cancelRate        = ordersInRange.length ? (cancelledCount / ordersInRange.length) * 100 : 0;

  function rangeLabel() {
    if (!startStr && !endStr) return 'Todo o período';
    const fmt = (s: string) =>
      new Date(s + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    if (startStr && endStr) return startStr === endStr ? fmt(startStr) : `${fmt(startStr)} — ${fmt(endStr)}`;
    if (startStr) return `A partir de ${fmt(startStr)}`;
    return `Até ${fmt(endStr)}`;
  }

  // ── Comparação mês atual vs mês anterior (fixo) ──
  const prevMonthDate = new Date(curYear, curMonth - 1, 1);
  const sales = orders.filter(o => o.status !== 'cancelled');

  const monthRevenue     = sales.filter(o => sameMonth(new Date(o.created_at), now)).reduce((s, o) => s + Number(o.total), 0);
  const prevMonthRevenue = sales.filter(o => sameMonth(new Date(o.created_at), prevMonthDate)).reduce((s, o) => s + Number(o.total), 0);
  const monthCount       = sales.filter(o => sameMonth(new Date(o.created_at), now)).length;
  const prevMonthCount   = sales.filter(o => sameMonth(new Date(o.created_at), prevMonthDate)).length;
  const monthCancel      = orders.filter(o => o.status === 'cancelled' && sameMonth(new Date(o.created_at), now)).length;
  const prevMonthCancel  = orders.filter(o => o.status === 'cancelled' && sameMonth(new Date(o.created_at), prevMonthDate)).length;

  const revGrowth    = growth(monthRevenue, prevMonthRevenue);
  const salesGrowth  = growth(monthCount, prevMonthCount);
  const cancelGrowth = growth(monthCancel, prevMonthCancel);

  // ── Faturamento dos últimos 6 meses ──
  const monthsBack: { label: string; revenue: number; count: number; cancelled: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(curYear, curMonth - i, 1);
    const list      = sales.filter(o => sameMonth(new Date(o.created_at), d));
    const cancelled = orders.filter(o => o.status === 'cancelled' && sameMonth(new Date(o.created_at), d)).length;
    monthsBack.push({
      label: MONTHS_SHORT[d.getMonth()],
      revenue: list.reduce((s, o) => s + Number(o.total), 0),
      count: list.length,
      cancelled,
    });
  }
  const maxMonthRev = Math.max(1, ...monthsBack.map(m => m.revenue));

  // ── Vendas dos últimos 7 dias ──
  const daysBack: { label: string; date: string; count: number; revenue: number; cancelled: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const list      = sales.filter(o => sameDay(new Date(o.created_at), d));
    const cancelled = orders.filter(o => o.status === 'cancelled' && sameDay(new Date(o.created_at), d)).length;
    daysBack.push({
      label: WEEKDAYS_SHORT[d.getDay()],
      date: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      count: list.length,
      revenue: list.reduce((s, o) => s + Number(o.total), 0),
      cancelled,
    });
  }
  const maxDayCount = Math.max(1, ...daysBack.map(d => d.count));

  // ── Bairros com mais entregas (dentro do filtro) ──
  const bairroMap = new Map<string, number>();
  for (const o of salesInRange) {
    const addr = o.address as Record<string, string> | null;
    const bairro = addr?.neighborhood?.trim();
    if (bairro) bairroMap.set(bairro, (bairroMap.get(bairro) ?? 0) + 1);
  }
  const topBairros = [...bairroMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxBairro = Math.max(1, ...topBairros.map(([, c]) => c));

  // ── Cards do resumo do período ──
  const summaryCards = [
    { label: 'Faturamento',          value: formatCurrency(revenueInRange), icon: DollarSign,  color: 'text-green-600',  bg: 'bg-green-50'      },
    { label: 'Vendas',               value: countInRange,                   icon: ShoppingBag, color: 'text-blue-600',   bg: 'bg-blue-50'       },
    { label: 'Ticket médio',         value: formatCurrency(avgTicket),      icon: BarChart3,   color: 'text-[#1A2E17]',  bg: 'bg-[#1A2E17]/10'  },
    { label: 'Pedidos cancelados',   value: cancelledCount,                 icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50', sub: lostInRange > 0 ? `${formatCurrency(lostInRange)} perdidos` : undefined },
    { label: 'Taxa de cancelamento', value: `${cancelRate.toFixed(0)}%`,    icon: TrendingDown,color: 'text-orange-500', bg: 'bg-orange-50'     },
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
            {/* ── Barra de filtros ── */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2DAC8] mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Filter size={15} className="text-[#C4A044]" />
                <h2 className="font-bold text-[#1A1A1A] text-sm">Filtrar período</h2>
                <span className="text-xs text-gray-400 font-medium ml-auto">{rangeLabel()}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Presets rápidos */}
                {PRESETS.map(p => (
                  <button
                    key={p.key}
                    onClick={() => applyPreset(p.key)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      preset === p.key
                        ? 'bg-[#1A2E17] text-white border-[#1A2E17]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-[#1A2E17]/40'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}

                <span className="w-px h-6 bg-gray-200 mx-1" />

                {/* Mês específico */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                  <Calendar size={13} className="text-[#C4A044]" />
                  <input
                    type="month"
                    value={monthSel}
                    max={`${curYear}-${String(curMonth + 1).padStart(2, '0')}`}
                    onChange={(e) => applyMonth(e.target.value)}
                    className="text-xs outline-none text-gray-700 bg-transparent"
                    title="Filtrar por mês"
                  />
                </div>

                <span className="w-px h-6 bg-gray-200 mx-1" />

                {/* Intervalo personalizado */}
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1">
                  <span className="text-[0.7rem] text-gray-400 font-semibold">De</span>
                  <input
                    type="date"
                    value={startStr}
                    max={endStr || todayKey}
                    onChange={(e) => { setStartStr(e.target.value); setPreset('custom'); setMonthSel(''); }}
                    className="text-xs outline-none text-gray-700 bg-transparent"
                  />
                  <span className="text-[0.7rem] text-gray-400 font-semibold">até</span>
                  <input
                    type="date"
                    value={endStr}
                    max={todayKey}
                    onChange={(e) => { setEndStr(e.target.value); setPreset('custom'); setMonthSel(''); }}
                    className="text-xs outline-none text-gray-700 bg-transparent"
                  />
                </div>

                <span className="w-px h-6 bg-gray-200 mx-1" />

                {/* Limpar filtro */}
                <button
                  onClick={clearFilter}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:text-red-500 hover:border-red-300 hover:bg-red-50 transition-all"
                  title="Limpar filtro (volta para Este mês)"
                >
                  <RotateCcw size={13} /> Limpar
                </button>
              </div>
            </div>

            {/* ── Resumo do período ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {summaryCards.map(({ label, value, icon: Icon, color, bg, sub }) => (
                <div key={label} className="bg-white rounded-2xl p-4 shadow-sm border border-[#E2DAC8]">
                  <div className={`w-9 h-9 ${bg} rounded-xl flex items-center justify-center mb-2.5`}>
                    <Icon size={18} className={color} />
                  </div>
                  <p className="text-xl font-black text-[#1A1A1A]">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                  {sub && <p className="text-[0.65rem] text-red-400 font-semibold mt-0.5">{sub}</p>}
                </div>
              ))}
            </div>

            {/* ── Comparação com o mês anterior (fixo) ── */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DAC8] mb-6">
              <h2 className="font-bold text-[#1A1A1A] mb-4 flex items-center gap-2 text-sm">
                <TrendingUp size={16} className="text-[#C4A044]" />
                Comparação com o mês anterior
                <span className="text-gray-400 font-normal">
                  ({MONTHS_SHORT[(curMonth + 11) % 12]} → {MONTHS_SHORT[curMonth]})
                </span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Faturamento */}
                <div className="bg-[#F9F6EF] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Faturamento</p>
                  <div className="flex items-end gap-2 flex-wrap">
                    <p className="text-xl font-black text-[#1A2E17]">{formatCurrency(monthRevenue)}</p>
                    <GrowthBadge pct={revGrowth} />
                  </div>
                  <p className="text-[0.7rem] text-gray-400 mt-1">Mês anterior: {formatCurrency(prevMonthRevenue)}</p>
                </div>
                {/* Vendas */}
                <div className="bg-[#F9F6EF] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Vendas (pedidos)</p>
                  <div className="flex items-end gap-2 flex-wrap">
                    <p className="text-xl font-black text-[#1A2E17]">{monthCount}</p>
                    <GrowthBadge pct={salesGrowth} />
                  </div>
                  <p className="text-[0.7rem] text-gray-400 mt-1">
                    Mês anterior: {prevMonthCount} {prevMonthCount === 1 ? 'pedido' : 'pedidos'}
                  </p>
                </div>
                {/* Cancelados */}
                <div className="bg-[#F9F6EF] rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Cancelados</p>
                  <div className="flex items-end gap-2 flex-wrap">
                    <p className="text-xl font-black text-red-500">{monthCancel}</p>
                    <GrowthBadge pct={cancelGrowth} invert />
                  </div>
                  <p className="text-[0.7rem] text-gray-400 mt-1">
                    Mês anterior: {prevMonthCancel} {prevMonthCancel === 1 ? 'cancelado' : 'cancelados'}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Gráficos ── */}
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
                        <div className="w-full rounded-t-lg transition-all"
                          style={{ height: `${Math.max(h, 2)}%`, background: isCurrent ? '#C4A044' : '#1A2E17' }}
                          title={`${m.label}: ${formatCurrency(m.revenue)} · ${m.count} vendas · ${m.cancelled} cancelados`}
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
                          style={{ height: `${Math.max(h, 2)}%`, background: isToday ? '#C4A044' : '#2B4A26' }}
                          title={`${d.date}: ${d.count} vendas · ${formatCurrency(d.revenue)}${d.cancelled ? ` · ${d.cancelled} cancelados` : ''}`}
                        />
                        <span className="text-[0.65rem] font-semibold text-gray-500">{d.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ── Bairros com mais entregas ── */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DAC8]">
              <h2 className="font-bold text-[#1A1A1A] mb-5 flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-[#C4A044]" />
                Bairros com mais entregas
                <span className="text-gray-400 font-normal text-xs">· {rangeLabel()}</span>
              </h2>
              {topBairros.length === 0 ? (
                <p className="text-sm text-gray-400 py-6 text-center">
                  Nenhuma entrega com bairro registrado neste período.
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
                              style={{ width: `${Math.max(w, 4)}%`, background: i === 0 ? '#C4A044' : '#1A2E17' }}
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

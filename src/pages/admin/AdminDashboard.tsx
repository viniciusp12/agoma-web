import { useEffect, useState } from 'react';
import { ShoppingBag, TrendingUp, Calendar, Clock, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { supabase, type DBOrder, type DBOrderItem } from '../../services/supabase';
import AdminLayout from '../../components/admin/AdminLayout';

function formatCurrency(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

type OrderWithItems = DBOrder & { order_items: DBOrderItem[] };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pendente',  color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-700'   },
  delivered: { label: 'Entregue',  color: 'bg-green-100 text-green-700'  },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-600'      },
};

export default function AdminDashboard() {
  const [orders, setOrders]     = useState<OrderWithItems[]>([]);
  const [loading, setLoading]   = useState(true);
  const [confirmDel, setConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    const { data } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(100);
    setOrders((data as OrderWithItems[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('orders').update({ status }).eq('id', id);
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status: status as DBOrder['status'] } : o));
  }

  async function handleDelete(id: string) {
    // deleta itens do pedido primeiro, depois o pedido
    await supabase.from('order_items').delete().eq('order_id', id);
    await supabase.from('orders').delete().eq('id', id);
    setOrders(prev => prev.filter(o => o.id !== id));
    setConfirm(null);
  }

  const today    = new Date().toDateString();
  const todayOrders   = orders.filter(o => new Date(o.created_at).toDateString() === today);
  const monthOrders   = orders.filter(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const todayRevenue  = todayOrders.reduce((s, o) => s + Number(o.total), 0);
  const monthRevenue  = monthOrders.reduce((s, o) => s + Number(o.total), 0);
  const avgTicket     = monthOrders.length ? monthRevenue / monthOrders.length : 0;

  const stats = [
    { label: 'Pedidos hoje',        value: todayOrders.length,        icon: ShoppingBag,  color: 'text-[#1A2E17]', bg: 'bg-[#1A2E17]/10' },
    { label: 'Faturamento hoje',    value: formatCurrency(todayRevenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50'     },
    { label: 'Pedidos no mês',      value: monthOrders.length,        icon: Calendar,     color: 'text-blue-600',  bg: 'bg-blue-50'      },
    { label: 'Faturamento no mês',  value: formatCurrency(monthRevenue), icon: TrendingUp, color: 'text-[#C4A044]', bg: 'bg-[#C4A044]/10' },
  ];

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#1A2E17]"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Dashboard
          </h1>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            {avgTicket > 0 && <span className="ml-2 text-[#C4A044] font-semibold">· Ticket médio {formatCurrency(avgTicket)}</span>}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2DAC8]">
              <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                <Icon size={20} className={color} />
              </div>
              <p className="text-2xl font-black text-[#1A1A1A]">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#E2DAC8] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-[#1A1A1A]">Pedidos recentes</h2>
            <button onClick={fetchOrders}
              className="text-xs text-[#C4A044] font-semibold hover:underline">
              Atualizar
            </button>
          </div>

          {loading ? (
            <div className="p-10 text-center text-gray-400 text-sm">Carregando...</div>
          ) : orders.length === 0 ? (
            <div className="p-10 text-center">
              <ShoppingBag size={40} className="mx-auto mb-3 text-gray-200" />
              <p className="text-gray-400 text-sm">Nenhum pedido ainda</p>
              <p className="text-gray-300 text-xs mt-1">Os pedidos aparecem aqui quando clientes finalizam pelo WhatsApp</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Data/Hora', 'Itens', 'Endereço', 'Total', 'Status', 'Ação'].map(h => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orders.map(order => {
                    const st = STATUS_LABELS[order.status] ?? STATUS_LABELS.pending;
                    const addr = order.address as Record<string, string> | null;
                    return (
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <p className="font-semibold text-[#1A1A1A]">{formatDate(order.created_at)}</p>
                          <p className="text-gray-400 text-xs flex items-center gap-1">
                            <Clock size={11} /> {formatTime(order.created_at)}
                          </p>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-0.5 max-w-[200px]">
                            {order.order_items?.slice(0, 2).map((oi, i) => (
                              <p key={i} className="text-gray-700 truncate text-xs">
                                {oi.quantity}x {oi.item_name}
                              </p>
                            ))}
                            {(order.order_items?.length ?? 0) > 2 && (
                              <p className="text-gray-400 text-xs">+{order.order_items.length - 2} itens</p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 max-w-[160px]">
                          {addr ? `${addr.street}, ${addr.number}` : '—'}
                        </td>
                        <td className="px-5 py-3 font-bold text-[#1A2E17] whitespace-nowrap">
                          {formatCurrency(Number(order.total))}
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st.color}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex gap-1 items-center">
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <button
                                onClick={() => updateStatus(order.id, order.status === 'pending' ? 'confirmed' : 'delivered')}
                                className="p-1.5 text-green-500 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all"
                                title={order.status === 'pending' ? 'Confirmar' : 'Marcar entregue'}
                              >
                                <CheckCircle size={16} />
                              </button>
                            )}
                            {order.status !== 'cancelled' && order.status !== 'delivered' && (
                              <button
                                onClick={() => updateStatus(order.id, 'cancelled')}
                                className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                title="Cancelar"
                              >
                                <XCircle size={16} />
                              </button>
                            )}

                            {/* Deletar pedido com confirmação inline */}
                            {confirmDel === order.id ? (
                              <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                                <span className="text-[0.65rem] text-red-600 font-semibold whitespace-nowrap">Deletar?</span>
                                <button onClick={() => handleDelete(order.id)}
                                  className="text-[0.65rem] font-bold bg-red-500 hover:bg-red-600 text-white px-1.5 py-0.5 rounded transition-all">
                                  Sim
                                </button>
                                <button onClick={() => setConfirm(null)}
                                  className="text-[0.65rem] font-bold bg-gray-200 hover:bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded transition-all">
                                  Não
                                </button>
                              </div>
                            ) : (
                              <button onClick={() => setConfirm(order.id)}
                                className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Deletar pedido">
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

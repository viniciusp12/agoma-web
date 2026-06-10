import { useEffect, useState } from 'react';
import { Plus, Pencil, Eye, EyeOff, X, Upload, Check, Trash2 } from 'lucide-react';
import { supabase, type DBMenuItem } from '../../services/supabase';
import AdminLayout from '../../components/admin/AdminLayout';

const CATEGORIES = [
  { id: 'ciabattas',  label: 'Ciabattas'  },
  { id: 'burguers',   label: 'Burguers'   },
  { id: 'wraps',      label: 'Wraps'      },
  { id: 'fritas',     label: 'Fritas'     },
  { id: 'croissants', label: 'Croissants' },
  { id: 'sobremesas', label: 'Sobremesas' },
  { id: 'bebidas',    label: 'Bebidas'    },
  { id: 'adicionais', label: 'Adicionais' },
];

const EMPTY: Omit<DBMenuItem, 'id' | 'created_at' | 'updated_at'> = {
  external_id: '', name: '', description: '', price: 0,
  category: 'burguers', image_url: null, badge: null,
  has_meat_point: false, can_be_combo: false,
  max_additionals: 10, active: true, display_order: 0,
};

export default function AdminCardapio() {
  const [items, setItems]         = useState<DBMenuItem[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filterCat, setFilterCat] = useState('all');
  const [editing, setEditing]     = useState<DBMenuItem | null>(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [saved, setSaved]           = useState(false);
  const [confirmDelete, setConfirm] = useState<string | null>(null); // id do item aguardando confirmação

  useEffect(() => { fetchItems(); }, []);

  async function fetchItems() {
    setLoading(true);
    const { data } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('display_order');
    setItems((data as DBMenuItem[]) ?? []);
    setLoading(false);
  }

  function openNew() {
    setEditing({ id: '__new__', created_at: '', updated_at: '', ...EMPTY });
    setForm(EMPTY);
  }

  function openEdit(item: DBMenuItem) {
    setEditing(item);
    setForm({
      external_id:    item.external_id,
      name:           item.name,
      description:    item.description,
      price:          item.price,
      category:       item.category,
      image_url:      item.image_url,
      badge:          item.badge,
      has_meat_point: item.has_meat_point,
      can_be_combo:   item.can_be_combo,
      max_additionals:item.max_additionals,
      active:         item.active,
      display_order:  item.display_order,
    });
  }

  async function handleSave() {
    if (!form.name || !form.price) return;
    setSaving(true);

    if (editing?.id === '__new__') {
      const { data } = await supabase.from('menu_items').insert([form]).select().single();
      if (data) setItems(prev => [...prev, data as DBMenuItem]);
    } else if (editing) {
      await supabase.from('menu_items').update({ ...form, updated_at: new Date().toISOString() }).eq('id', editing.id);
      setItems(prev => prev.map(i => i.id === editing.id ? { ...i, ...form } : i));
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setEditing(null); }, 800);
  }

  async function toggleActive(item: DBMenuItem) {
    await supabase.from('menu_items').update({ active: !item.active }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, active: !i.active } : i));
  }

  async function handleDelete(id: string) {
    await supabase.from('menu_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    setConfirm(null);
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext  = file.name.split('.').pop();
    const path = `menu/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('images').upload(path, file, { upsert: true });

    if (!error) {
      const { data } = supabase.storage.from('images').getPublicUrl(path);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
    }
    setUploading(false);
  }

  const displayed = filterCat === 'all' ? items : items.filter(i => i.category === filterCat);

  return (
    <AdminLayout>
      <div className="p-6 max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-[#1A2E17]"
              style={{ fontFamily: "'Playfair Display', serif" }}>
              Cardápio
            </h1>
            <p className="text-gray-500 text-sm">{items.length} itens cadastrados</p>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-2 bg-[#1A2E17] hover:bg-[#2B4A26] text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-all">
            <Plus size={16} /> Novo item
          </button>
        </div>

        {/* Category filter */}
        <div className="flex gap-2 flex-wrap mb-5">
          <button
            onClick={() => setFilterCat('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterCat === 'all' ? 'bg-[#1A2E17] text-white' : 'bg-white border border-[#E2DAC8] text-gray-500 hover:border-gray-300'}`}
          >
            Todos ({items.length})
          </button>
          {CATEGORIES.map(c => {
            const count = items.filter(i => i.category === c.id).length;
            return (
              <button key={c.id}
                onClick={() => setFilterCat(c.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${filterCat === c.id ? 'bg-[#1A2E17] text-white' : 'bg-white border border-[#E2DAC8] text-gray-500 hover:border-gray-300'}`}
              >
                {c.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 text-gray-400 text-sm">Carregando...</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-[#E2DAC8] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Item', 'Categoria', 'Preço', 'Opções', 'Máx. adicionais', 'Status', 'Ações'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {displayed.map(item => (
                  <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${!item.active ? 'opacity-40' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name}
                            className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 bg-[#EDE6D8] rounded-lg shrink-0" />
                        )}
                        <div>
                          <p className="font-semibold text-[#1A1A1A]">{item.name}</p>
                          {item.badge && <span className="text-[0.6rem] bg-[#1A2E17] text-[#C4A044] px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500 capitalize">{item.category}</td>
                    <td className="px-4 py-3 font-bold text-[#1A2E17]">R$ {Number(item.price).toFixed(2)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {item.has_meat_point && <span className="mr-1">🥩 ponto</span>}
                      {item.can_be_combo   && <span>🔥 combo</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{item.max_additionals}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${item.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {item.active ? 'Ativo' : 'Oculto'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 items-center">
                        <button onClick={() => openEdit(item)}
                          className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Editar">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => toggleActive(item)}
                          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                          title={item.active ? 'Ocultar' : 'Ativar'}>
                          {item.active ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>

                        {/* Deletar — pede confirmação inline */}
                        {confirmDelete === item.id ? (
                          <div className="flex items-center gap-1 bg-red-50 border border-red-200 rounded-lg px-2 py-1">
                            <span className="text-[0.65rem] text-red-600 font-semibold whitespace-nowrap">Confirmar?</span>
                            <button onClick={() => handleDelete(item.id)}
                              className="text-[0.65rem] font-bold bg-red-500 hover:bg-red-600 text-white px-1.5 py-0.5 rounded transition-all">
                              Sim
                            </button>
                            <button onClick={() => setConfirm(null)}
                              className="text-[0.65rem] font-bold bg-gray-200 hover:bg-gray-300 text-gray-600 px-1.5 py-0.5 rounded transition-all">
                              Não
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirm(item.id)}
                            className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Deletar">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Edit / New Modal ── */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditing(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">

            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
              <h2 className="font-bold text-[#1A1A1A]">
                {editing.id === '__new__' ? 'Novo item' : `Editar: ${editing.name}`}
              </h2>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex flex-col gap-4">

              {/* Foto */}
              <div>
                <label className="text-sm font-semibold text-[#1A1A1A] mb-2 block">Foto</label>
                <div className="flex items-center gap-3">
                  {form.image_url ? (
                    <img src={form.image_url} className="w-20 h-20 object-cover rounded-xl" />
                  ) : (
                    <div className="w-20 h-20 bg-[#EDE6D8] rounded-xl flex items-center justify-center text-2xl">🍔</div>
                  )}
                  <label className={`flex items-center gap-2 border-2 border-dashed border-gray-200 hover:border-[#1A2E17] rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-pointer transition-all ${uploading ? 'opacity-50' : ''}`}>
                    <Upload size={16} />
                    {uploading ? 'Enviando...' : 'Enviar foto'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
                  </label>
                </div>
              </div>

              {/* Nome */}
              <F label="Nome do item *">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Smash Meleca" className="input-field" />
              </F>

              {/* Descrição */}
              <F label="Descrição">
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Ingredientes, preparo..." className="input-field resize-none" />
              </F>

              {/* Preço + Categoria */}
              <div className="grid grid-cols-2 gap-3">
                <F label="Preço (R$) *">
                  <input type="number" min="0" step="0.50"
                    value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))}
                    className="input-field" />
                </F>
                <F label="Categoria">
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="input-field">
                    {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                  </select>
                </F>
              </div>

              {/* Badge + Máx adicionais */}
              <div className="grid grid-cols-2 gap-3">
                <F label="Badge (ex: ⭐ top)">
                  <input value={form.badge ?? ''} onChange={e => setForm(f => ({ ...f, badge: e.target.value || null }))}
                    placeholder="Opcional" className="input-field" />
                </F>
                <F label="Máx. adicionais">
                  <input type="number" min="0" max="20"
                    value={form.max_additionals} onChange={e => setForm(f => ({ ...f, max_additionals: Number(e.target.value) }))}
                    className="input-field" />
                </F>
              </div>

              {/* Toggles */}
              <div className="flex flex-col gap-2">
                <Toggle
                  label="Pede ponto da carne"
                  checked={form.has_meat_point}
                  onChange={v => setForm(f => ({ ...f, has_meat_point: v }))}
                />
                <Toggle
                  label="Pode virar combo (+R$ 16)"
                  checked={form.can_be_combo}
                  onChange={v => setForm(f => ({ ...f, can_be_combo: v }))}
                />
                <Toggle
                  label="Visível no cardápio"
                  checked={form.active}
                  onChange={v => setForm(f => ({ ...f, active: v }))}
                />
              </div>

              {/* Save */}
              <button
                onClick={handleSave}
                disabled={saving || !form.name || !form.price}
                className="w-full bg-[#1A2E17] hover:bg-[#2B4A26] disabled:opacity-40 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2"
              >
                {saved ? <><Check size={18} /> Salvo!</> : saving ? 'Salvando...' : 'Salvar item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-[#1A1A1A]">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full transition-colors relative ${checked ? 'bg-[#1A2E17]' : 'bg-gray-200'}`}
      >
        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? 'left-5' : 'left-1'}`} />
      </div>
    </label>
  );
}

import { useState, useEffect } from 'react';
import { X, Home, Briefcase, Heart, ChevronLeft } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import type { Address, ViaCEPResponse } from '../../types';

type LabelType = Address['label'];

export default function AddressModal() {
  const { state, saveAddress, setStep, closeModals } = useCart();

  const [form, setForm] = useState<Omit<Address, 'label'>>({
    cep: '', street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '', reference: '',
  });
  const [label, setLabel] = useState<LabelType>('Casa');
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});

  // Preenche com dados do ViaCEP
  useEffect(() => {
    if (state.step === 'address') {
      document.body.style.overflow = 'hidden';
      try {
        const raw = sessionStorage.getItem('agoma_viacep');
        if (raw) {
          const data: ViaCEPResponse = JSON.parse(raw);
          setForm((f) => ({
            ...f,
            cep: data.cep,
            street: data.logradouro ?? '',
            neighborhood: data.bairro ?? '',
            city: data.localidade ?? '',
            state: data.uf ?? '',
          }));
        }
      } catch { /* ignore */ }
    }
    return () => { document.body.style.overflow = ''; };
  }, [state.step]);

  if (state.step !== 'address') return null;

  function set(field: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate(): boolean {
    const errs: typeof errors = {};
    if (!form.street.trim())       errs.street       = 'Informe a rua';
    if (!form.number.trim())       errs.number       = 'Informe o número';
    if (!form.neighborhood.trim()) errs.neighborhood = 'Informe o bairro';
    if (!form.city.trim())         errs.city         = 'Informe a cidade';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    saveAddress({ ...form, label });
  }

  const LABELS: { key: LabelType; icon: React.ReactNode; text: string }[] = [
    { key: 'Casa',      icon: <Home size={16} />,      text: 'Casa'      },
    { key: 'Trabalho',  icon: <Briefcase size={16} />, text: 'Trabalho'  },
    { key: 'Favorito',  icon: <Heart size={16} />,     text: 'Favorito'  },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModals} />

      {/* Modal — bottom sheet no mobile, centered no desktop */}
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto animate-fade-up">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3 rounded-t-2xl z-10">
          <button onClick={() => setStep('cep')} className="text-gray-400 hover:text-gray-600">
            <ChevronLeft size={22} />
          </button>
          <div className="flex-1">
            <h2 className="font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Onde deseja receber seu pedido?
            </h2>
            <p className="text-xs text-[#1A2E17] font-semibold">Insira um endereço.</p>
          </div>
          <button onClick={closeModals} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          {/* CEP */}
          <Field label="CEP">
            <input readOnly value={form.cep}
              className="input-field bg-gray-50 cursor-not-allowed" />
          </Field>

          {/* Endereço */}
          <Field label="Endereço" error={errors.street}>
            <input value={form.street} onChange={(e) => set('street', e.target.value)}
              placeholder="Rua, Avenida..." className="input-field" />
          </Field>

          {/* Número + Complemento */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Número" error={errors.number}>
              <input value={form.number} onChange={(e) => set('number', e.target.value)}
                placeholder="Ex: 42" className="input-field" />
            </Field>
            <Field label="Complemento">
              <input value={form.complement} onChange={(e) => set('complement', e.target.value)}
                placeholder="Apto, bloco..." className="input-field" />
            </Field>
          </div>

          {/* Bairro */}
          <Field label="Bairro" error={errors.neighborhood}>
            <input value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)}
              placeholder="Bairro" className="input-field" />
          </Field>

          {/* Cidade + Estado */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade" error={errors.city}>
              <input value={form.city} onChange={(e) => set('city', e.target.value)}
                placeholder="São Paulo" className="input-field" />
            </Field>
            <Field label="Estado">
              <input value={form.state} onChange={(e) => set('state', e.target.value)}
                placeholder="SP" maxLength={2} className="input-field uppercase" />
            </Field>
          </div>

          {/* Referência */}
          <Field label="Referência para o entregador">
            <input value={form.reference} onChange={(e) => set('reference', e.target.value)}
              placeholder="Ex: Portão azul" className="input-field" />
          </Field>

          {/* Label */}
          <div>
            <p className="text-sm font-semibold text-[#1A1A1A] mb-2">Gravar endereço?</p>
            <div className="flex gap-2">
              {LABELS.map(({ key, icon, text }) => (
                <button
                  key={key}
                  onClick={() => setLabel(key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    label === key
                      ? 'border-[#1A2E17] bg-[#1A2E17] text-white'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {icon} {text}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSave}
            className="w-full bg-[#1A2E17] hover:bg-[#2B4A26] text-white font-bold py-3.5 rounded-xl transition-all mt-2"
          >
            Salvar endereço
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label, error, children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-semibold text-[#1A1A1A]">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}

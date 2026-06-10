import { useState, useRef, useEffect } from 'react';
import { X, MapPin, Loader2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { fetchAddressByCEP, formatCEP } from '../../services/viacep';
import type { ViaCEPResponse } from '../../types';

export default function CEPModal() {
  const { state, setStep, closeModals } = useCart();
  const [cep, setCep] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.step === 'cep') {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = 'hidden';
    }
    return () => { document.body.style.overflow = ''; };
  }, [state.step]);

  if (state.step !== 'cep') return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const digits = cep.replace(/\D/g, '');
    if (digits.length !== 8) { setError('Digite um CEP válido com 8 dígitos.'); return; }

    setLoading(true);
    try {
      const data: ViaCEPResponse = await fetchAddressByCEP(digits);
      // Avança para o modal de endereço passando os dados via sessionStorage
      sessionStorage.setItem('agoma_viacep', JSON.stringify(data));
      setStep('address');
    } catch {
      setError('CEP não encontrado. Verifique e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && closeModals()}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-up">
        {/* Close */}
        <button
          onClick={closeModals}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-[#1A2E17] rounded-full flex items-center justify-center">
            <MapPin size={26} className="text-[#C4A044]" />
          </div>
        </div>

        <h2 className="text-xl font-bold text-center text-[#1A1A1A] mb-1" style={{ fontFamily: "'Playfair Display', serif" }}>
          Informe seu CEP
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Assim saberemos se entregamos na sua região!
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              placeholder="00000-000"
              value={cep}
              onChange={(e) => {
                setCep(formatCEP(e.target.value));
                setError('');
              }}
              maxLength={9}
              className="w-full pl-9 pr-4 py-3 border-2 border-gray-200 rounded-xl text-base font-medium focus:border-[#1A2E17] outline-none transition-colors"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || cep.replace(/\D/g, '').length < 8}
            className="w-full bg-[#1A2E17] hover:bg-[#2B4A26] disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : null}
            Continuar
          </button>
        </form>

        <p className="text-center mt-4 text-xs text-gray-400">
          Não sabe seu CEP?{' '}
          <a
            href="https://buscacepinter.correios.com.br/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#1A2E17] font-semibold underline"
          >
            Consulte aqui
          </a>
        </p>
      </div>
    </div>
  );
}

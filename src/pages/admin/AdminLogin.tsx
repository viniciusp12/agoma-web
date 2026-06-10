import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, Lock } from 'lucide-react';

export default function AdminLogin() {
  const { signIn, user } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow]         = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    if (user) navigate('/admin', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const err = await signIn(email, password);
    if (err) {
      setError('Email ou senha incorretos.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#1A2E17] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <p className="text-[#F5F0E6] font-black text-3xl tracking-wide mb-1"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            AGOMA.
          </p>
          <p className="text-[#C4A044] text-xs tracking-widest uppercase font-semibold">
            Painel Administrativo
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-[#1A2E17] rounded-lg flex items-center justify-center">
              <Lock size={16} className="text-[#C4A044]" />
            </div>
            <h1 className="font-bold text-[#1A1A1A] text-lg">Entrar</h1>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@agoma.com.br"
                required
                className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A2E17] focus:ring-2 focus:ring-[#1A2E17]/10 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-semibold text-gray-700">Senha</label>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#1A2E17] focus:ring-2 focus:ring-[#1A2E17]/10 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShow(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#1A2E17] hover:bg-[#2B4A26] disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

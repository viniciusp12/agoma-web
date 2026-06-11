import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UtensilsCrossed, LogOut, ExternalLink, ClipboardList } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/admin',           label: 'Pedidos',   icon: ClipboardList,   end: true },
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/cardapio',  label: 'Cardápio',  icon: UtensilsCrossed, end: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate('/admin/login');
  }

  return (
    <div className="min-h-screen flex bg-[#F5F2EC]">

      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-[#1A2E17] flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <p className="text-[#F5F0E6] font-black text-lg tracking-wide"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            AGOMA.
          </p>
          <p className="text-[#C4A044] text-[0.6rem] tracking-widest uppercase font-semibold">
            Painel Admin
          </p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-[#C4A044] text-[#1A2E17]'
                    : 'text-[#F5F0E6]/60 hover:text-[#F5F0E6] hover:bg-white/10'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-3 py-4 border-t border-white/10 flex flex-col gap-1">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-[#F5F0E6]/60 hover:text-[#F5F0E6] hover:bg-white/10 transition-all"
          >
            <ExternalLink size={17} /> Ver site
          </a>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-white/10 transition-all"
          >
            <LogOut size={17} /> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

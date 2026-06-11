import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingCart from './components/FloatingCart';
import CartDrawer from './components/CartDrawer';
import CEPModal from './components/modals/CEPModal';
import AddressModal from './components/modals/AddressModal';
import CustomizeModal from './components/modals/CustomizeModal';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/admin/ProtectedRoute';
import Home from './pages/Home';
import Cardapio from './pages/Cardapio';
import Pedidos from './pages/Pedidos';
import MeusPedidos from './pages/MeusPedidos';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCardapio from './pages/admin/AdminCardapio';

function PublicSite() {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <Routes>
            <Route path="/"         element={<Home />} />
            <Route path="/cardapio" element={<Cardapio />} />
            <Route path="/pedidos"       element={<Pedidos />} />
            <Route path="/meus-pedidos" element={<MeusPedidos />} />
          </Routes>
        </main>
        <Footer />
      </div>
      <CEPModal />
      <AddressModal />
      <CustomizeModal />
      <CartDrawer />
      <FloatingCart />
    </CartProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <Routes>
          {/* --- Admin --- */}
          <Route path="/admin/login"    element={<AdminLogin />} />
          <Route path="/admin"          element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/cardapio" element={<ProtectedRoute><AdminCardapio /></ProtectedRoute>} />

          {/* --- Site público --- */}
          <Route path="/*" element={<PublicSite />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

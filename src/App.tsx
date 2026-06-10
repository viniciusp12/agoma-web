import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingCart from './components/FloatingCart';
import CartDrawer from './components/CartDrawer';
import CEPModal from './components/modals/CEPModal';
import AddressModal from './components/modals/AddressModal';
import CustomizeModal from './components/modals/CustomizeModal';
import Home from './pages/Home';
import Cardapio from './pages/Cardapio';

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/"         element={<Home />} />
              <Route path="/cardapio" element={<Cardapio />} />
            </Routes>
          </main>
          <Footer />
        </div>

        {/* Global overlays */}
        <CEPModal />
        <AddressModal />
        <CustomizeModal />
        <CartDrawer />
        <FloatingCart />
      </CartProvider>
    </BrowserRouter>
  );
}

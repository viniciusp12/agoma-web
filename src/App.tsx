import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Cardapio from './pages/Cardapio';

export default function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

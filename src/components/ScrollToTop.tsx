import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/** Rola para o topo da página sempre que a rota mudar */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

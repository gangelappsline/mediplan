import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

/** Vuelve al inicio de la página en cada navegación de SPA. */
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

/**
 * Layout raíz: comportamiento compartido por todas las rutas
 * (reinicio de scroll). La composición visual de cada sección vive en
 * `MarketingLayout` y `AuthLayout`.
 */
function RootLayout() {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
}

export { RootLayout };

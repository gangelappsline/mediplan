import { Outlet } from 'react-router-dom';

import { Footer } from '@/shared/components/layout/Footer';
import { Header } from '@/shared/components/layout/Header';

/** Layout público de la landing: header, contenido y footer. */
function MarketingLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export { MarketingLayout };

import { Link } from 'react-router-dom';

import { Logo } from '@/shared/components/Logo';

const productLinks = [
  { label: 'Funciones', href: '#funciones' },
  { label: 'Precios', href: '#precios' },
  { label: 'Testimonios', href: '#testimonios' },
] as const;

const placeholderLinks = ['Términos y condiciones', 'Privacidad', 'Contacto'] as const;

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60 bg-muted/30">
      <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-10 md:flex-row">
          <div className="max-w-xs space-y-3">
            <Logo />
            <p className="text-sm text-muted-foreground">
              La agenda inteligente para clínicas y consultorios. Citas, seguimiento de pacientes
              y promociones automáticas en un solo lugar.
            </p>
          </div>

          <nav aria-label="Enlaces del pie de página" className="flex gap-16">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Producto</h3>
              <ul className="space-y-2">
                {productLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
                <li>
                  <Link
                    to="/login"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Iniciar sesión
                  </Link>
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Legal</h3>
              <ul className="space-y-2">
                {placeholderLinks.map((label) => (
                  <li key={label}>
                    {/* Placeholder sin funcionalidad (fase actual). */}
                    <a
                      href="#"
                      onClick={(event) => {
                        event.preventDefault();
                      }}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 text-sm text-muted-foreground sm:flex-row sm:items-center">
          <p>© {year} MediPlan. Todos los derechos reservados.</p>
          <p>Hecho para profesionales de la salud y la estética.</p>
        </div>
      </div>
    </footer>
  );
}

export { Footer };

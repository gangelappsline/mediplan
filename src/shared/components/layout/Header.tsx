import { AnimatePresence, motion } from 'motion/react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

import { useTheme } from '@/shared/components/ThemeProvider';
import { Logo } from '@/shared/components/Logo';
import { Button } from '@/shared/components/ui/button';
import { cn } from '@/shared/lib/utils';

const navLinks = [
  { label: 'Funciones', href: '#funciones' },
  { label: 'Precios', href: '#precios' },
  { label: 'Testimonios', href: '#testimonios' },
] as const;

interface ThemeToggleProps {
  className?: string;
}

function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn('text-muted-foreground', className)}
      onClick={toggleTheme}
      aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {theme === 'dark' ? <Sun /> : <Moon />}
    </Button>
  );
}

function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" aria-label="MediPlan — Ir al inicio" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Navegación principal" className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild className="hidden sm:inline-flex">
            <Link to="/register">Comenzar gratis</Link>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => {
              setMobileMenuOpen((open) => !open);
            }}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen ? (
          <motion.div
            id="mobile-menu"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden border-t border-border/60 bg-background md:hidden"
          >
            <nav aria-label="Navegación móvil" className="flex flex-col gap-1 px-4 py-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => {
                    setMobileMenuOpen(false);
                  }}
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2">
                <Button asChild variant="outline">
                  <Link
                    to="/login"
                    onClick={() => {
                      setMobileMenuOpen(false);
                    }}
                  >
                    Iniciar sesión
                  </Link>
                </Button>
                <Button asChild>
                  <Link
                    to="/register"
                    onClick={() => {
                      setMobileMenuOpen(false);
                    }}
                  >
                    Comenzar gratis
                  </Link>
                </Button>
              </div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}

export { Header, ThemeToggle };

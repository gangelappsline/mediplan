import { cn } from '@/shared/lib/utils';

interface LogoMarkProps {
  className?: string;
}

/** Isotipo de MediPlan: agenda con check en gradiente teal. */
function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('size-9', className)}
    >
      <defs>
        <linearGradient id="mediplan-logo-gradient" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#14b8a6" />
          <stop offset="1" stopColor="#0e7490" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="14" fill="url(#mediplan-logo-gradient)" />
      <rect x="15" y="19" width="34" height="30" rx="6" fill="#ffffff" opacity="0.96" />
      <path d="M15 25a6 6 0 0 1 6-6h16a6 6 0 0 1 6 6v2H15z" fill="#0f766e" />
      <rect x="22" y="12" width="4" height="9" rx="2" fill="#ffffff" />
      <rect x="38" y="12" width="4" height="9" rx="2" fill="#ffffff" />
      <path
        d="M23 37.5l5.5 5.5L41 30.5"
        stroke="#0f766e"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

interface LogoProps {
  className?: string;
  markClassName?: string;
  /** Tamaño del wordmark. */
  size?: 'sm' | 'md' | 'lg';
}

const textSizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
} as const;

/** Logo completo de MediPlan (isotipo + wordmark). */
function Logo({ className, markClassName, size = 'md' }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className={cn(size === 'lg' && 'size-10', markClassName)} />
      <span className={cn('font-semibold tracking-tight', textSizes[size])}>
        Medi<span className="text-primary">Plan</span>
      </span>
    </span>
  );
}

export { Logo, LogoMark, type LogoProps };

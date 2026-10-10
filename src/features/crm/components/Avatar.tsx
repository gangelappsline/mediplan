import { initials } from '@/features/crm/format';
import { cn } from '@/shared/lib/utils';

const avatarTones = [
  'bg-teal-500/15 text-teal-700 dark:text-teal-300',
  'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  'bg-rose-500/15 text-rose-700 dark:text-rose-300',
  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
] as const;

const avatarSizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
} as const;

interface AvatarProps {
  name: string;
  size?: keyof typeof avatarSizes;
  className?: string;
}

/** Avatar con iniciales y tono de color determinista según el nombre. */
function Avatar({ name, size = 'md', className }: AvatarProps) {
  const hash = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  const tone = avatarTones[hash % avatarTones.length];

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full font-semibold',
        avatarSizes[size],
        tone,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

export { Avatar, type AvatarProps };

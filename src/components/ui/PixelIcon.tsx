import { cn } from '@/lib/utils';

interface PixelIconProps {
  name: string;
  className?: string;
  label?: string;
}

export const PixelIcon = ({ name, className, label }: PixelIconProps) => (
  <i
    className={cn('hn inline-block text-[1em] leading-none', `hn-${name}`, className)}
    aria-hidden={label ? undefined : true}
    aria-label={label}
    role={label ? 'img' : undefined}
  />
);
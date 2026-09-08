import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface PixelIconProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  label?: string;
}

export const PixelIcon = forwardRef<HTMLElement, PixelIconProps>(
  ({ name, className, label, ...props }, ref) => (
    <i
      ref={ref}
      className={cn('hn inline-block text-[1em] leading-none', `hn-${name}`, className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      {...props}
    />
  ),
);

PixelIcon.displayName = 'PixelIcon';

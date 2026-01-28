import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Map of commonly used icon names to their paths in the pixel icon library
const iconMap: Record<string, string> = {
  'arrow-left': 'solid/arrow-narrow-left.svg',
  'search': 'solid/search.svg',
  'globe': 'solid/globe.svg',
  'linkedin': 'brands/linkedin.svg',
  'globe2': 'solid/world.svg',
  'chevron-up': 'solid/chevron-up.svg',
  'chevron-down': 'solid/chevron-down.svg',
  'plus': 'solid/plus.svg',
  'trash': 'solid/trash.svg',
  'map-pin': 'solid/map-pin.svg',
  'loader': 'solid/refresh.svg',
  'pencil': 'solid/pencil.svg',
  'x': 'solid/x.svg',
  'check': 'solid/check.svg',
  'eye': 'solid/eye.svg',
  'eye-off': 'solid/eye-off.svg',
  'log-out': 'solid/log-out.svg',
  'clock': 'solid/clock.svg',
  'calendar': 'solid/calendar.svg',
  'lock': 'solid/lock.svg',
  'user': 'solid/user.svg',
  'external-link': 'solid/external-link.svg',
};

interface PixelIconProps {
  name: keyof typeof iconMap | string;
  size?: number;
  className?: string;
  'aria-hidden'?: boolean;
}

export const PixelIcon = ({ 
  name, 
  size = 16, 
  className,
  'aria-hidden': ariaHidden = true 
}: PixelIconProps) => {
  const [svgContent, setSvgContent] = useState<string | null>(null);
  
  useEffect(() => {
    const iconPath = iconMap[name];
    if (!iconPath) {
      console.warn(`PixelIcon: No mapping found for icon "${name}"`);
      return;
    }
    
    // Load the SVG content
    import(`@hackernoon/pixel-icon-library/icons/SVG/${iconPath}?raw`)
      .then((module) => {
        setSvgContent(module.default);
      })
      .catch(() => {
        console.warn(`PixelIcon: Failed to load icon "${name}"`);
      });
  }, [name]);

  if (!svgContent) {
    // Return a placeholder while loading
    return (
      <span 
        className={cn("inline-block", className)} 
        style={{ width: size, height: size }}
        aria-hidden={ariaHidden}
      />
    );
  }

  return (
    <span
      className={cn("inline-flex items-center justify-center shrink-0", className)}
      style={{ width: size, height: size }}
      aria-hidden={ariaHidden}
      dangerouslySetInnerHTML={{ 
        __html: svgContent
          .replace(/width="[^"]*"/, `width="${size}"`)
          .replace(/height="[^"]*"/, `height="${size}"`)
          .replace(/fill="[^"]*"/g, 'fill="currentColor"')
      }}
    />
  );
};

export default PixelIcon;

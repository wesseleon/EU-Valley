import { Button } from '@/components/ui/button';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

export const ThemeToggle = ({ className }: ThemeToggleProps) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-pressed={isDark}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={cn('border-border bg-card transition-colors hover:bg-primary hover:text-primary-foreground', className)}
    >
      <PixelIcon name={isDark ? 'sun' : 'moon'} />
    </Button>
  );
};

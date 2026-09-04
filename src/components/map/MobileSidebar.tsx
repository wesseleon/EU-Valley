import { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { PixelIcon } from '@/components/ui/PixelIcon';

interface MobileSidebarProps {
  children: React.ReactNode;
  className?: string;
}

export const MobileSidebar = ({ children, className }: MobileSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setDragStartY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging) return;
    const diff = e.touches[0].clientY - dragStartY;
    
    // Allow both up and down dragging
    if (isExpanded) {
      // When expanded, allow dragging down to collapse
      setCurrentTranslate(Math.max(0, diff));
    } else {
      // When collapsed, allow dragging up to expand
      setCurrentTranslate(Math.min(0, diff));
    }
  }, [isDragging, dragStartY, isExpanded]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    
    if (isExpanded && currentTranslate > 100) {
      setIsExpanded(false);
    } else if (!isExpanded && currentTranslate < -100) {
      setIsExpanded(true);
    }
    
    setCurrentTranslate(0);
  }, [currentTranslate, isExpanded]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      toggleExpand();
    }
  };

  const getTransformStyle = () => {
    if (isDragging) {
      if (isExpanded) {
        return `translateY(${currentTranslate}px)`;
      } else {
        return `translateY(calc(100% - 4rem + ${currentTranslate}px))`;
      }
    }
    return isExpanded ? 'translateY(0)' : 'translateY(calc(100% - 4rem))';
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 bg-card backdrop-blur-lg rounded-t-lg shadow-xl transition-transform duration-300 ease-out md:hidden border-t border-border",
        className
      )}
      style={{
        transform: getTransformStyle(),
        height: '85dvh',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex h-16 flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={toggleExpand}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse company list' : 'Expand company list'}
      >
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-1" />
        {isExpanded ? (
          <PixelIcon name="arrow-down" className="text-muted-foreground" />
        ) : (
          <PixelIcon name="arrow-up" className="text-muted-foreground" />
        )}
      </div>
      
      {/* Content with scrolling enabled - use overflow-auto for touch scrolling */}
      <div 
        className="overflow-y-auto overscroll-contain"
        style={{ height: 'calc(85dvh - 4rem)' }}
      >
        {children}
      </div>
    </div>
  );
};

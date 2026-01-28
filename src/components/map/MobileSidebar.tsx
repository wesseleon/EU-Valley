import { useState, useRef, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        "fixed inset-x-0 bottom-0 z-50 bg-card backdrop-blur-lg rounded-t-2xl shadow-xl transition-transform duration-300 ease-out md:hidden",
        className
      )}
      style={{
        transform: getTransformStyle(),
        maxHeight: '85vh',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex flex-col items-center py-3 cursor-grab active:cursor-grabbing touch-none"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={toggleExpand}
      >
        <div className="w-10 h-1 bg-muted-foreground/30 rounded-full mb-1" />
        {isExpanded ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      
      {/* Content with scrolling enabled */}
      <ScrollArea 
        className="h-full" 
        style={{ maxHeight: 'calc(85vh - 3rem)' }}
      >
        {children}
      </ScrollArea>
    </div>
  );
};

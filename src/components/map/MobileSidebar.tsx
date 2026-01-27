import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    setCurrentTranslate(Math.max(0, diff));
  }, [isDragging, dragStartY]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (currentTranslate > 100) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
    }
    setCurrentTranslate(0);
  }, [currentTranslate]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-lg rounded-t-2xl shadow-xl transition-transform duration-300 ease-out md:hidden",
        isExpanded ? "translate-y-0" : "translate-y-[calc(100%-4rem)]",
        className
      )}
      style={{
        transform: isDragging && isExpanded 
          ? `translateY(${currentTranslate}px)` 
          : undefined,
        maxHeight: '85vh',
      }}
    >
      {/* Drag handle */}
      <div
        className="flex flex-col items-center py-3 cursor-grab active:cursor-grabbing"
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
      
      {/* Content */}
      <div className="overflow-hidden" style={{ maxHeight: 'calc(85vh - 3rem)' }}>
        {children}
      </div>
    </div>
  );
};

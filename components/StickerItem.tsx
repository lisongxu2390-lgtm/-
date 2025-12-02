import React, { useState, useRef } from 'react';
import { StickerData } from '../types';

interface StickerItemProps {
  sticker: StickerData;
  isNew: boolean;
  onUpdate: (id: string, updates: Partial<StickerData>) => void;
  onFocus: (id: string) => void;
}

const StickerItem: React.FC<StickerItemProps> = ({ sticker, isNew, onUpdate, onFocus }) => {
  const [loaded, setLoaded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  
  // Refs to store initial values during drag/resize operations
  const dragStartRef = useRef<{ x: number; y: number; initialX: number; initialY: number } | null>(null);
  const resizeStartRef = useRef<{ x: number; y: number; initialScale: number } | null>(null);

  // Bring to front on interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only start drag if we aren't clicking the resize handle
    // (The resize handle has its own handler via stopPropagation, but good to be safe)
    if (isResizing) return;
    
    e.preventDefault(); // Prevent text selection/scrolling
    onFocus(sticker.id);
    setIsDragging(true);
    
    // Capture the pointer to track movement even if it leaves the element
    (e.target as Element).setPointerCapture(e.pointerId);

    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialX: sticker.x,
      initialY: sticker.y,
    };
  };

  const handleResizePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onFocus(sticker.id);
    setIsResizing(true);
    
    (e.target as Element).setPointerCapture(e.pointerId);

    resizeStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialScale: sticker.scale,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (isDragging && dragStartRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      
      onUpdate(sticker.id, {
        x: dragStartRef.current.initialX + dx,
        y: dragStartRef.current.initialY + dy,
      });
    }

    if (isResizing && resizeStartRef.current) {
      const dx = e.clientX - resizeStartRef.current.x;
      // We rely mainly on horizontal movement for scaling to keep it simple, 
      // or we could use the diagonal distance.
      // 100px movement = +1 scale factor roughly
      const scaleDelta = dx * 0.005; 
      const newScale = Math.max(0.3, Math.min(3, resizeStartRef.current.initialScale + scaleDelta));
      
      onUpdate(sticker.id, {
        scale: newScale,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    setIsResizing(false);
    dragStartRef.current = null;
    resizeStartRef.current = null;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div 
      className={`
        absolute flex flex-col items-center touch-none select-none
        ${isNew ? 'opacity-0 scale-50' : 'opacity-100'}
        ${loaded && isNew ? 'animate-drop-in' : ''}
      `}
      style={{
        left: sticker.x,
        top: sticker.y,
        transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale})`,
        zIndex: isDragging || isResizing ? 1000 : 10, // Temporarily boost z-index while dragging
        transition: isDragging || isResizing ? 'none' : 'opacity 0.5s, transform 0.1s', // No transition during drag for responsiveness
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp} // Handle interruption
    >
      {/* Visual Container */}
      <div className="relative group">
        
        {/* The Sticker Image */}
        <div className={`
          relative sticker-shadow transition-all duration-200
          ${(isDragging || isResizing) ? 'scale-105' : ''}
        `}>
          <img
            src={sticker.imageUrl}
            alt={sticker.prompt}
            draggable={false} // Disable native HTML5 drag
            className="w-56 h-56 object-contain pointer-events-none" // pointer-events-none on img ensures the div handles events
            onLoad={() => setLoaded(true)}
          />
        </div>

        {/* Hover/Active UI Controls - White Dashed Line for Dark Background */}
        <div className={`
          absolute -inset-4 border-2 border-dashed border-white/40 rounded-xl pointer-events-none transition-opacity
          ${(isDragging || isResizing) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
        `}></div>

        {/* Resize Handle */}
        <div
          onPointerDown={handleResizePointerDown}
          className={`
            absolute -bottom-6 -right-6 w-8 h-8 bg-white border-2 border-gray-300 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]
            flex items-center justify-center cursor-nwse-resize z-50 pointer-events-auto transition-opacity
             ${(isDragging || isResizing) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
          `}
        >
          <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m4 0l-5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </div>
      </div>
      
      {/* Label - White box with black text */}
      <div className={`
        mt-2 bg-white/90 text-black text-xs font-bold px-3 py-1.5 rounded-full shadow-lg max-w-[200px] text-center pointer-events-none transition-opacity
        ${(isDragging || isResizing) ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}
      `}>
        {sticker.city}
      </div>

      <style>{`
        @keyframes drop-in {
          0% { opacity: 0; transform: translate(-50%, -150%) rotate(0deg) scale(0.5); }
          100% { opacity: 1; transform: translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${sticker.scale}); }
        }
        .animate-drop-in {
          animation: drop-in 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>
    </div>
  );
};

export default StickerItem;
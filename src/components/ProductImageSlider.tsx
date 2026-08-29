import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductImageSliderProps {
  images?: string[];
  fallbackImage?: string;
  alt: string;
  className?: string;
  aspectClassName?: string;
  intervalMs?: number; // default 2500ms (2.5 sec)
  showDots?: boolean;
  showArrows?: boolean;
  onImageClick?: () => void;
  overlayBadge?: React.ReactNode;
}

export default function ProductImageSlider({
  images,
  fallbackImage,
  alt,
  className = '',
  aspectClassName = 'aspect-square',
  intervalMs = 2500, // 2.5 seconds auto-slide
  showDots = true,
  showArrows = false,
  onImageClick,
  overlayBadge
}: ProductImageSliderProps) {
  // Normalize images list (ensure at least 1 image)
  const slides = (images && images.length > 0) 
    ? images 
    : (fallbackImage ? [fallbackImage] : []);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-slide effect every 2.5 seconds
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [slides.length, isPaused, intervalMs]);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const handlePrev = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleDotClick = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex(index);
  };

  if (slides.length === 0) {
    return (
      <div className={`relative w-full ${aspectClassName} bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-2xl">🍽️</span>
      </div>
    );
  }

  return (
    <div 
      className={`relative w-full overflow-hidden select-none group ${aspectClassName} ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onClick={onImageClick}
    >
      {/* Slide Images */}
      <AnimatePresence initial={false} mode="wait">
        <motion.img
          key={currentIndex}
          src={slides[currentIndex]}
          alt={`${alt} - Photo ${currentIndex + 1}`}
          initial={{ opacity: 0.6, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0.4 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      </AnimatePresence>

      {/* Subtle overlay gradient for better contrast */}
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none" />

      {/* Overlay Badge Slot (e.g., Diet / Calories) */}
      {overlayBadge}

      {/* Manual Arrow Controls (visible on hover / touch if enabled) */}
      {showArrows && slides.length > 1 && (
        <>
          <button
            onClick={handlePrev}
            aria-label="Previous photo"
            className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNext}
            aria-label="Next photo"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </>
      )}

      {/* 3-Dot Slide Progress Indicator */}
      {showDots && slides.length > 1 && (
        <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-auto">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => handleDotClick(idx, e)}
              aria-label={`Go to slide ${idx + 1}`}
              className={`transition-all duration-300 rounded-full cursor-pointer ${
                idx === currentIndex
                  ? 'w-4 h-1.5 bg-brand-green shadow-xs'
                  : 'w-1.5 h-1.5 bg-white/70 hover:bg-white'
              }`}
            />
          ))}
        </div>
      )}

      {/* 3X Photos Tag */}
      {slides.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-xs px-1.5 py-0.5 rounded-md text-[8.5px] font-black text-white/90 tracking-tight z-10 pointer-events-none">
          {currentIndex + 1}/{slides.length}
        </div>
      )}
    </div>
  );
}

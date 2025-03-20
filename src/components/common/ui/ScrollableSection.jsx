import React, { useRef } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export default function ScrollableSection({ title, children, className = "" }) {
  const scrollContainerRef = useRef(null);

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    // Increased from 0.75 to 1 (100% of container width)
    const scrollDistance = container.clientWidth * 1; 
    
    container.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth'
    });
  };

  const handleScrollLeft = () => scroll('left');
  const handleScrollRight = () => scroll('right');

  return (
    <div className={`mb-8 sm:mb-10 ${className}`}>
      {/* Title and scroll controls */}
      <div className="mb-3 sm:mb-4 flex justify-between items-center">
        {title && (
          typeof title === 'string' 
            ? <h2 className="text-2xl sm:text-3xl font-bold text-start">{title}</h2>
            : title
        )}
        
        <div className="hidden sm:flex space-x-2">
          <button 
            onClick={handleScrollLeft}
            className="p-2 rounded-full hover:bg-muted/20 text-white transition-colors"
            aria-label="Scroll left"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button 
            onClick={handleScrollRight}
            className="p-2 rounded-full hover:bg-muted/20 text-white transition-colors"
            aria-label="Scroll right"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
      
      {/* Scrollable content */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto pb-4 scrollbar-hide scroll-smooth"
        >
          {children}
        </div>
        
        {/* Mobile scroll buttons overlaid on content */}
        <button 
          onClick={handleScrollLeft}
          className="sm:hidden absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-dark/60 text-white"
          aria-label="Scroll left"
        >
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <button 
          onClick={handleScrollRight}
          className="sm:hidden absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-dark/60 text-white"
          aria-label="Scroll right"
        >
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </div>
  );
}
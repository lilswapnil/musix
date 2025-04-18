import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export default function ScrollableSection({ title, children }) {
  const scrollContainerRef = React.useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isOverflowing, setIsOverflowing] = useState(false);

  // Calculate total pages when content changes
  useEffect(() => {
    const calculatePages = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollWidth = container.scrollWidth;
        const clientWidth = container.clientWidth;
        
        // Check if content overflows container
        const hasOverflow = scrollWidth > clientWidth;
        setIsOverflowing(hasOverflow);
        
        if (hasOverflow) {
          // Calculate how many pages we need
          const pages = Math.ceil(scrollWidth / clientWidth);
          setTotalPages(pages);
        } else {
          setTotalPages(1);
        }
      }
    };
    
    calculatePages();
    
    // Recalculate on window resize
    window.addEventListener('resize', calculatePages);
    return () => window.removeEventListener('resize', calculatePages);
  }, [children]);

  // Update current page on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const container = scrollContainerRef.current;
        const scrollPosition = container.scrollLeft;
        const pageWidth = container.clientWidth;
        const newPage = Math.round(scrollPosition / pageWidth);
        
        setCurrentPage(newPage);
      }
    };
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth;
      
      if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };

  const scrollToPage = (pageIndex) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * pageIndex;
      container.scrollLeft = scrollAmount;
    }
  };

  return (
    <div className="mb-10">
      {/* Title section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {typeof title === 'string' ? <h2 className="text-3xl font-bold text-start">{title}</h2> : title}
        </div>
        
        {isOverflowing && (
          <div className="flex space-x-2">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full hover:bg-muted/20 transition-colors"
              aria-label="Scroll left"
              disabled={currentPage === 0}
            >
              <FontAwesomeIcon icon={faChevronLeft} className={currentPage === 0 ? "text-muted/40" : ""} />
            </button>
            <button
              onClick={() => scroll('right')}
              className="p-2 rounded-full hover:bg-muted/20 transition-colors"
              aria-label="Scroll right"
              disabled={currentPage === totalPages - 1}
            >
              <FontAwesomeIcon icon={faChevronRight} className={currentPage === totalPages - 1 ? "text-muted/40" : ""} />
            </button>
          </div>
        )}
      </div>
      
      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 hide-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {children}
      </div>
      
      {/* Pagination indicators */}
      {isOverflowing && totalPages > 1 && (
        <div className="flex justify-center mt-4 space-x-1">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToPage(index)}
              aria-label={`Go to page ${index + 1}`}
              className={`w-2 h-2 rounded-full transition-all ${
                currentPage === index 
                  ? 'bg-accent w-4' 
                  : 'bg-muted/40 hover:bg-muted/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
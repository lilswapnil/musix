import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";

export default function ScrollableSection({ title, children, className = "" }) {
  const scrollContainerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [showDots, setShowDots] = useState(false);
  const dotsTimeoutRef = useRef(null);

  // Calculate total pages and update when window resizes
  useEffect(() => {
    const calculatePages = () => {
      if (!scrollContainerRef.current) return;
      
      const container = scrollContainerRef.current;
      const totalWidth = container.scrollWidth;
      const viewWidth = container.clientWidth;
      
      // Calculate total pages (minimum 1)
      const pages = Math.ceil(totalWidth / viewWidth);
      setTotalPages(Math.max(1, pages));
    };
    
    // Calculate on mount and when window resizes
    calculatePages();
    window.addEventListener('resize', calculatePages);
    
    return () => {
      window.removeEventListener('resize', calculatePages);
    };
  }, [children]); // Recalculate when children change

  // Track scroll position to update current page
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    
    const handleScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;
      
      const scrollLeft = container.scrollLeft;
      const viewWidth = container.clientWidth;
      const newPage = Math.round(scrollLeft / viewWidth);
      
      setCurrentPage(newPage);
      showDotsTemporarily();
    };
    
    const container = scrollContainerRef.current;
    container.addEventListener('scroll', handleScroll);
    
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Show dots temporarily
  const showDotsTemporarily = () => {
    setShowDots(true);
    
    // Clear any existing timeout
    if (dotsTimeoutRef.current) {
      clearTimeout(dotsTimeoutRef.current);
    }
    
    // Set new timeout to hide dots after 2 seconds
    dotsTimeoutRef.current = setTimeout(() => {
      setShowDots(false);
    }, 2000);
  };

  const scroll = (direction) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollDistance = container.clientWidth; 
    
    container.scrollBy({
      left: direction === 'left' ? -scrollDistance : scrollDistance,
      behavior: 'smooth'
    });
    
    // Show dots when scrolling via buttons
    showDotsTemporarily();
  };

  // Scroll to specific page when dot is clicked
  const scrollToPage = (pageIndex) => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    container.scrollTo({
      left: pageIndex * container.clientWidth,
      behavior: 'smooth'
    });
    
    // Show dots when clicking on a dot
    showDotsTemporarily();
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
      
      {/* Scrollable content with hidden scrollbars */}
      <div className="relative">
        <div 
          ref={scrollContainerRef}
          className="overflow-x-auto pb-6 scroll-smooth"
          style={{ 
            scrollbarWidth: 'none',  /* Firefox */
            msOverflowStyle: 'none',  /* IE and Edge */
            WebkitOverflowScrolling: 'touch'
          }}
        >
          {/* Hide scrollbars for Webkit browsers */}
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
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
        
        {/* Pagination dots - moved to be more visible */}
        {totalPages > 1 && (
          <div 
            className={`absolute -bottom-4 left-0 right-0 flex justify-center space-x-2 pb-1 transition-opacity duration-300 ${
              showDots ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {Array.from({ length: totalPages }).map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToPage(index)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentPage 
                    ? 'bg-white scale-125' 
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to page ${index + 1}`}
                aria-current={index === currentPage ? 'true' : 'false'}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
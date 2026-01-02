import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight, faPlus } from '@fortawesome/free-solid-svg-icons';

export default function ScrollableSection({ title, children, onLoadMore, loadingMore }) {
  const scrollContainerRef = React.useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isAtEnd, setIsAtEnd] = useState(false);

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
          // Get the width of the first scrollable item (direct child or nested flex item)
          const firstChild = container.querySelector(':scope > *:first-child > *:first-child') 
            || container.querySelector(':scope > *:first-child')
            || container.firstElementChild;
          const itemWidth = firstChild ? firstChild.offsetWidth + 8 : clientWidth;
          const itemsInView = Math.max(1, Math.floor(clientWidth / itemWidth));
          const scrollPerPage = itemWidth * itemsInView;
          
          const maxScrollLeft = scrollWidth - clientWidth;
          const pages = Math.max(1, Math.ceil(maxScrollLeft / scrollPerPage) + 1);
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
        const maxScrollLeft = container.scrollWidth - container.clientWidth;
        
        // Get the width of the first scrollable item
        const firstChild = container.querySelector(':scope > *:first-child > *:first-child') 
          || container.querySelector(':scope > *:first-child')
          || container.firstElementChild;
        const itemWidth = firstChild ? firstChild.offsetWidth + 8 : container.clientWidth;
        const itemsInView = Math.max(1, Math.floor(container.clientWidth / itemWidth));
        const scrollPerPage = itemWidth * itemsInView;
        
        // Calculate page based on scroll position
        const newPage = Math.round(scrollPosition / scrollPerPage);
        setCurrentPage(Math.min(newPage, totalPages - 1));
        
        // Check if we're at the end (within 10px tolerance)
        setIsAtEnd(scrollPosition >= maxScrollLeft - 10);
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [totalPages]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      // Get the width of the first scrollable item
      const firstChild = container.querySelector(':scope > *:first-child > *:first-child') 
        || container.querySelector(':scope > *:first-child')
        || container.firstElementChild;
      const itemWidth = firstChild ? firstChild.offsetWidth + 8 : container.clientWidth; // 8px for gap
      
      // Calculate how many items fit in view and scroll by that amount
      const itemsInView = Math.max(1, Math.floor(container.clientWidth / itemWidth));
      const scrollAmount = itemWidth * itemsInView;

      if (direction === 'left') {
        container.scrollLeft = Math.max(0, container.scrollLeft - scrollAmount);
      } else {
        // Clamp to max scroll position to prevent over-scrolling
        const newScrollLeft = container.scrollLeft + scrollAmount;
        container.scrollLeft = Math.min(maxScrollLeft, newScrollLeft);
      }
    }
  };

  const scrollToPage = (pageIndex) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      
      // Get the width of the first scrollable item
      const firstChild = container.querySelector(':scope > *:first-child > *:first-child') 
        || container.querySelector(':scope > *:first-child')
        || container.firstElementChild;
      const itemWidth = firstChild ? firstChild.offsetWidth + 8 : container.clientWidth;
      const itemsInView = Math.max(1, Math.floor(container.clientWidth / itemWidth));
      const scrollAmount = itemWidth * itemsInView * pageIndex;
      
      container.scrollLeft = Math.min(scrollAmount, maxScrollLeft);
    }
  };

  return (
    <div className="mb-10">
      {/* Title section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {typeof title === 'string' ? <h2 className="text-3xl font-bold text-start">{title}</h2> : title}
        </div>

        {/* Navigation arrows and Load More button */}
        {isOverflowing && (
          <div className="flex space-x-2 items-center">
            <button
              onClick={() => scroll('left')}
              className="p-2 rounded-full hover:bg-muted/20 transition-colors"
              aria-label="Scroll left"
              disabled={currentPage === 0}
            >
              <FontAwesomeIcon icon={faChevronLeft} className={currentPage === 0 ? 'text-muted/40' : ''} />
            </button>
            
            {/* Show Load More button when at the end and onLoadMore is provided */}
            {isAtEnd && onLoadMore ? (
              <button
                onClick={onLoadMore}
                disabled={loadingMore}
                className="px-3 py-1.5 rounded-full bg-accent/20 hover:bg-accent/40 transition-colors text-sm flex items-center gap-1.5 disabled:opacity-50"
                aria-label="Load more"
              >
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            ) : (
              <button
                onClick={() => scroll('right')}
                className="p-2 rounded-full hover:bg-muted/20 transition-colors"
                aria-label="Scroll right"
                disabled={isAtEnd}
              >
                <FontAwesomeIcon icon={faChevronRight} className={isAtEnd ? 'text-muted/40' : ''} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Scrollable content - with enhanced scrollbar hiding */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto scrollbar-none"
        style={{
          scrollBehavior: 'smooth',
          msOverflowStyle: 'none', // IE and Edge
          scrollbarWidth: 'none', // Firefox
        }}
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
                currentPage === index ? 'bg-accent w-4' : 'bg-muted/40 hover:bg-muted/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
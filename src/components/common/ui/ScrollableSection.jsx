import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

export default function ScrollableSection({ title, children }) {
  const scrollContainerRef = React.useRef(null);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const scrollAmount = container.clientWidth * 0.75;
      
      if (direction === 'left') {
        container.scrollLeft -= scrollAmount;
      } else {
        container.scrollLeft += scrollAmount;
      }
    }
  };

  return (
    <div className="mb-10">
      {/* Title section */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          {typeof title === 'string' ? <h2 className="text-3xl font-bold text-start">{title}</h2> : title}
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-full hover:bg-muted/20 transition-colors"
            aria-label="Scroll left"
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full hover:bg-muted/20 transition-colors"
            aria-label="Scroll right"
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </button>
        </div>
      </div>
      
      {/* Scrollable content */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto pb-4 hide-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {children}
      </div>
    </div>
  );
}
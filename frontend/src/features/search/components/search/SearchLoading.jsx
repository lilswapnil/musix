import React from "react";
import ScrollableSection from "../../../../components/common/ui/ScrollableSection";
import { CardSkeleton, SongRowSkeleton } from "../../../../components/common/ui/Skeleton";

export default function SearchLoading() {
  return (
    <>
      <div className="mb-8">
        <ScrollableSection
          title={<h3 className="text-2xl font-semibold text-start">Songs</h3>}
        >
          <div className="flex space-x-2 scrollbar-hide">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 rounded-lg p-2 w-[320px] md:w-[360px] lg:w-[390px]"
              >
                {Array.from({ length: 4 }).map((__, i) => (
                  <SongRowSkeleton key={i} />
                ))}
              </div>
            ))}
          </div>
        </ScrollableSection>
      </div>

      <ScrollableSection title="Albums">
        <div className="flex space-x-2 pb-1 scrollbar-hide">
          {Array.from({ length: 8 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </ScrollableSection>
    </>
  );
}

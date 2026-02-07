import React from "react";
import { Skeleton } from "../../../../components/common/ui/Skeleton";

export default function AISingleRecommendationSkeleton() {
  return (
    <div className="relative h-auto sm:h-80 rounded-xl overflow-hidden shadow-lg glass-card p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-end">
          <Skeleton className="h-4 w-20 mb-2" />
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-1" />
          <Skeleton className="h-3 w-1/3 mb-4" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

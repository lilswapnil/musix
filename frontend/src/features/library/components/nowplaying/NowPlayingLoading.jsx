import React from "react";
import { Skeleton } from "../../../../components/common/ui/Skeleton";

export default function NowPlayingLoading() {
  return (
    <div className="mb-12 mt-4">
      <h2 className="text-3xl font-bold mb-4 text-start">Now Playing</h2>
      <div className="relative h-auto sm:h-80 rounded-xl overflow-hidden shadow-lg glass-card p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0 w-40 h-40 sm:w-48 sm:h-48 md:w-64 md:h-64">
            <Skeleton className="w-full h-full rounded-lg" />
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <Skeleton className="h-8 w-2/3 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/3 mb-4" />
            <Skeleton className="h-9 w-40 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

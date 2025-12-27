import React from 'react';
import { Skeleton } from './Skeleton';

export default function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-8">
      <Skeleton className="h-8 w-40 mb-6" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    </div>
  );
}

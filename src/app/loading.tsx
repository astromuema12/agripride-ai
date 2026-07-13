'use client';

import { Wheat } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Wheat className="h-6 w-6 text-[#2d6a4f] dark:text-[#5e9a6b] animate-pulse" />
        <div className="h-0.5 w-16 bg-[var(--border)] rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-[#2d6a4f] dark:bg-[#5e9a6b] rounded-full animate-[shimmer_1.5s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
}

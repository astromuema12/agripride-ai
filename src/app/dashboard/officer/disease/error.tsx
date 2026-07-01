'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function OfficerDiseaseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Officer Disease page error:', error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="rounded-full bg-red-50 p-4 mb-4">
        <AlertTriangle className="h-10 w-10 text-red-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to load disease reports</h2>
      <p className="text-sm text-gray-500 max-w-md mb-6">
        Something went wrong while loading the disease reports. This might be a temporary issue.
      </p>
      <Button onClick={reset} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
}

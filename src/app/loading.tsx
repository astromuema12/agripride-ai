import { Wheat } from 'lucide-react';

export default function RootLoading() {
  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
          <Wheat className="h-6 w-6 text-white animate-pulse" />
        </div>
        <p className="text-sm text-[var(--muted-foreground)]">Loading...</p>
      </div>
    </div>
  );
}

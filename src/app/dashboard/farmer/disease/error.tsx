"use client";

import { RouteError } from "@/components/dashboard/RouteError";

export default function DiseaseError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} title="Unable to load disease diagnosis" description="Something went wrong while loading the diagnosis tool. This might be a temporary issue." />;
}

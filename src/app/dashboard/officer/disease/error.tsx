"use client";

import { RouteError } from "@/components/dashboard/RouteError";

export default function OfficerDiseaseError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} title="Unable to load disease reports" description="Something went wrong while loading the disease reports. This might be a temporary issue." />;
}

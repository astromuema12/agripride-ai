"use client";

import { RouteError } from "@/components/dashboard/RouteError";

export default function OfficerExportError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} />;
}

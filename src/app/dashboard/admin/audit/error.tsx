"use client";

import { RouteError } from "@/components/dashboard/RouteError";

export default function AdminAuditError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <RouteError error={error} reset={reset} />;
}

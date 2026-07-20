"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/dashboard/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import { testimonialService } from "@/services/testimonial.service";
import type { Testimonial } from "@/types";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function AdminTestimonialsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [pending, setPending] = useState<Testimonial[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [pendingPage, setPendingPage] = useState(1);
  const [approved, setApproved] = useState<Testimonial[]>([]);
  const [approvedTotal, setApprovedTotal] = useState(0);
  const [approvedPage, setApprovedPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([testimonialService.getPending(PAGE_SIZE, (pendingPage - 1) * PAGE_SIZE), testimonialService.getApproved(PAGE_SIZE, (approvedPage - 1) * PAGE_SIZE)])
      .then(([p, a]) => {
        if (!cancelled) {
          setPending(p.data);
          setPendingTotal(p.total);
          setApproved(a.data);
          setApprovedTotal(a.total);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          toast.error(t("testimonials.failedToLoad"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pendingPage, approvedPage, t]);

  const handleApprove = async (id: string) => {
    if (!user) return;
    await testimonialService.approve(id, user.id);
    const found = pending.find((p) => p.id === id);
    setPending((prev) => prev.filter((p) => p.id !== id));
    setPendingTotal((prev) => prev - 1);
    if (found) {
      setApproved((prev) => [found, ...prev]);
      setApprovedTotal((prev) => prev + 1);
    }
    toast.success(t("testimonials.approved"));
  };

  const handleReject = async (id: string) => {
    await testimonialService.reject(id);
    setPending((prev) => prev.filter((p) => p.id !== id));
    setPendingTotal((prev) => prev - 1);
    toast.success(t("testimonials.rejected"));
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("testimonials.title")}</h1>
        <p className="text-sm text-gray-500">{t("testimonials.description")}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">{t("testimonials.pendingApproval", { count: pendingTotal })}</h2>
          {pending.length === 0 ? (
            <p className="text-sm text-gray-400">{t("testimonials.noPending")}</p>
          ) : (
            <div className="space-y-4">
              {pending.map((testimonial) => (
                <div key={testimonial.id} className="flex items-start justify-between rounded-lg border border-gray-100 bg-gray-50 p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{testimonial.name}</span>
                      {testimonial.location && <span className="text-xs text-gray-500">{testimonial.location}</span>}
                      {testimonial.farm_type && (
                        <Badge variant="primary" className="text-[10px]">
                          {testimonial.farm_type}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">&ldquo;{testimonial.content}&rdquo;</p>
                  </div>
                  <div className="ml-4 flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleApprove(testimonial.id)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleReject(testimonial.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Pagination page={pendingPage} total={pendingTotal} pageSize={PAGE_SIZE} onPageChange={setPendingPage} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="mb-4 text-lg font-bold text-gray-900">{t("testimonials.approvedTitle", { count: approvedTotal })}</h2>
          {approved.length === 0 ? (
            <p className="text-sm text-gray-400">{t("testimonials.noApproved")}</p>
          ) : (
            <div className="space-y-3">
              {approved.map((testimonial) => (
                <div key={testimonial.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-3">
                  <Check className="h-5 w-5 shrink-0 text-green-500" />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-gray-900">{testimonial.name}</span>
                    <p className="truncate text-xs text-gray-500">{testimonial.content.slice(0, 100)}</p>
                  </div>
                  {testimonial.approved_at && <span className="text-xs text-gray-400">{new Date(testimonial.approved_at).toLocaleDateString()}</span>}
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Pagination page={approvedPage} total={approvedTotal} pageSize={PAGE_SIZE} onPageChange={setApprovedPage} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

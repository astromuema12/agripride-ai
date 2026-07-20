"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n";
import { Mail, Phone, CheckCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Pagination } from "@/components/dashboard/Pagination";
import { contactService } from "@/services/contact.service";
import { validateEmailHref, validateTelHref } from "@/middleware/security";
import type { ContactInquiry } from "@/types";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function AdminContactsPage() {
  const { t } = useI18n();
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let cancelled = false;
    contactService
      .getPaginated(PAGE_SIZE, (page - 1) * PAGE_SIZE)
      .then(({ data, total: totalCount }) => {
        if (!cancelled) {
          setInquiries(data);
          setTotal(totalCount);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
          toast.error(t("contacts.failedToLoad"));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, t]);

  const markResolved = async (id: string) => {
    await contactService.markResolved(id);
    setInquiries((prev) => prev.map((i) => (i.id === id ? { ...i, status: "resolved" } : i)));
    toast.success(t("contacts.markedResolved"));
  };

  const markSpam = async (id: string) => {
    await contactService.markSpam(id);
    setInquiries((prev) => prev.filter((i) => i.id !== id));
    setTotal((prev) => prev - 1);
    toast.success(t("contacts.markedSpam"));
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );

  const statusColors: Record<string, string> = { pending: "bg-yellow-100 text-yellow-700", resolved: "bg-green-100 text-green-700", spam: "bg-red-100 text-red-700" };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t("contacts.title")}</h1>
        <p className="text-sm text-gray-500">{t("contacts.description")}</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {inquiries.length === 0 ? (
              <p className="text-sm text-gray-400">{t("contacts.noInquiries")}</p>
            ) : (
              inquiries.map((inq) => (
                <div key={inq.id} className="rounded-lg border border-gray-100 bg-white p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-gray-900">{inq.name}</span>
                        <a href={validateEmailHref(inq.email)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                          <Mail className="h-3 w-3" /> {inq.email}
                        </a>
                        {inq.phone && (
                          <a href={validateTelHref(inq.phone)} className="flex items-center gap-1 text-xs text-gray-500">
                            <Phone className="h-3 w-3" /> {inq.phone}
                          </a>
                        )}
                        <Badge className={`text-[10px] ${statusColors[inq.status] || "bg-gray-100 text-gray-600"}`}>{inq.status}</Badge>
                      </div>
                      <p className="mt-1 text-sm font-medium text-gray-700">{inq.subject}</p>
                      <p className="mt-1 text-sm text-gray-500 line-clamp-3">{inq.message}</p>
                      <p className="mt-1 text-xs text-gray-400">{new Date(inq.created_at).toLocaleString()}</p>
                    </div>
                    <div className="ml-4 flex gap-2">
                      {inq.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" className="text-green-600 border-green-200" onClick={() => markResolved(inq.id)}>
                            <CheckCircle className="h-4 w-4" /> {t("contacts.resolve")}
                          </Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => markSpam(inq.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}

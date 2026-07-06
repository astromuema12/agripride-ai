'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, AlertTriangle, CheckCircle, CreditCard, RefreshCw, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

export default function TermsPage() {
  const { t } = useI18n();

  const sections = [
    { title: t('legal.terms.sections.acceptance.title'), content: t('legal.terms.sections.acceptance.content') },
    { title: t('legal.terms.sections.userAccounts.title'), content: t('legal.terms.sections.userAccounts.content') },
    { title: t('legal.terms.sections.acceptableUse.title'), content: t('legal.terms.sections.acceptableUse.content') },
    { title: t('legal.terms.sections.paymentsAndSubscriptions.title'), content: t('legal.terms.sections.paymentsAndSubscriptions.content') },
    { title: t('legal.terms.sections.aiAdviceDisclaimer.title'), content: t('legal.terms.sections.aiAdviceDisclaimer.content') },
    { title: t('legal.terms.sections.intellectualProperty.title'), content: t('legal.terms.sections.intellectualProperty.content') },
    { title: t('legal.terms.sections.serviceAvailability.title'), content: t('legal.terms.sections.serviceAvailability.content') },
    { title: t('legal.terms.sections.limitationOfLiability.title'), content: t('legal.terms.sections.limitationOfLiability.content') },
    { title: t('legal.terms.sections.changesToTerms.title'), content: t('legal.terms.sections.changesToTerms.content') },
    { title: t('legal.terms.sections.termination.title'), content: t('legal.terms.sections.termination.content') },
    { title: t('legal.terms.sections.governingLaw.title'), content: t('legal.terms.sections.governingLaw.content') },
    { title: t('legal.terms.sections.contactInformation.title'), content: t('legal.terms.sections.contactInformation.content') },
  ];

  useEffect(() => {
    document.title = t('legal.terms.title') + ' | AgriPride AI';
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[var(--background)] dark:to-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">
            <ScrollText className="mr-1 h-3 w-3" />
            {t('legal.terms.badge')}
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-[var(--foreground)]">{t('legal.terms.title')}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-[var(--muted-foreground)]">
            {t('legal.terms.lastUpdated')}
          </p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 text-center">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">{t('legal.terms.cards.termsApply')}</p>
          </div>
          <div className="rounded-lg border border-[#d1d5db] bg-[#e2f0ee]/30 p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-6 w-6 text-[#0f766e]" />
            <p className="text-sm font-medium text-[#183028]">{t('legal.terms.cards.dataStaysYours')}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-center">
            <ScrollText className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">{t('legal.terms.cards.kenyaLaw')}</p>
          </div>
        </div>

        <div className="space-y-8">
          {sections.map((section, i) => (
            <motion.div
              key={section.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <h2 className="text-xl font-bold text-gray-900 dark:text-[var(--foreground)]">{section.title}</h2>
              <p className="mt-2 leading-relaxed text-gray-600 dark:text-[var(--muted-foreground)]">{section.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

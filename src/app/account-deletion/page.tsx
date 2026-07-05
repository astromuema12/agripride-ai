'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShieldCheck, Clock, Mail, FileText, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

const sectionKeys = [
  'howToRequest',
  'informationRequired',
  'dataThatWillBeDeleted',
  'dataThatMayBeRetained',
  'processingTimeline',
  'importantNotes',
  'contactInformation',
] as const;

const summaryCardKeys = [
  { key: 'permanentDeletion', icon: Trash2, color: 'border-red-100 bg-red-50/50', iconColor: 'text-red-600', titleColor: 'text-red-800' },
  { key: 'sevenBusinessDays', icon: Clock, color: 'border-amber-100 bg-amber-50/50', iconColor: 'text-amber-600', titleColor: 'text-amber-800' },
  { key: 'secureProcess', icon: ShieldCheck, color: 'border-[#c4d4e4] bg-[#c4d4e4]/30', iconColor: 'text-[#445c8c]', titleColor: 'text-[#445c8c]' },
] as const;

export default function AccountDeletionPage() {
  const { t } = useI18n();

  const sections = sectionKeys.map((key) => ({
    title: t(`legal.accountDeletion.sections.${key}.title`),
    content: t(`legal.accountDeletion.sections.${key}.content`),
  }));

  useEffect(() => {
    document.title = t('legal.accountDeletion.title') + ' | AgriPride AI';
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[var(--background)] dark:to-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">
            <Trash2 className="mr-1 h-3 w-3" />
            {t('legal.accountDeletion.badge')}
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-[var(--foreground)]">{t('legal.accountDeletion.title')}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-[var(--muted-foreground)]">
            {t('legal.accountDeletion.lastUpdated')}
          </p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {summaryCardKeys.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.key} className={`rounded-lg border ${card.color} p-4 text-center`}>
                <Icon className={`mx-auto mb-2 h-6 w-6 ${card.iconColor}`} />
                <p className={`text-sm font-medium ${card.titleColor}`}>{t(`legal.accountDeletion.cards.${card.key}.title`)}</p>
                <p className="mt-1 text-xs text-gray-500">{t(`legal.accountDeletion.cards.${card.key}.description`)}</p>
              </div>
            );
          })}
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

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-10"
        >
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c4d4e4] dark:bg-[#445c8c]/30">
                  <Mail className="h-5 w-5 text-[#445c8c] dark:text-[#a4dca7]" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-[var(--foreground)]">{t('legal.accountDeletion.readyToSubmit')}</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
                    {t('legal.accountDeletion.readyToSubmitDesc', { email: 'musauedwin2004@gmail.com' })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

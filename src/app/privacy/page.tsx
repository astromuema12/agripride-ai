'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

const sectionKeys = [
  'informationWeCollect',
  'howWeUseYourInformation',
  'aiProcessingData',
  'cookiesAndAnalytics',
  'dataSharing',
  'dataSecurity',
  'dataRetention',
  'yourRights',
  'contactUs',
  'changesToPolicy',
] as const;

export default function PrivacyPage() {
  const { t } = useI18n();

  const sections = sectionKeys.map((key) => ({
    title: t(`legal.privacy.sections.${key}.title`),
    content: t(`legal.privacy.sections.${key}.content`),
  }));

  useEffect(() => {
    document.title = t('legal.privacy.title') + ' | AgriPride AI';
  }, [t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[var(--background)] dark:to-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">
            <Shield className="mr-1 h-3 w-3" />
            {t('legal.privacy.badge')}
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-[var(--foreground)]">{t('legal.privacy.title')}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-[var(--muted-foreground)]">
            {t('legal.privacy.lastUpdated')}
          </p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-[#ccccbe] bg-[#c4d4e4]/30 dark:border-[#445c8c] dark:bg-[#283854] p-4 text-center">
            <Lock className="mx-auto mb-2 h-6 w-6 text-[#445c8c] dark:text-[#a4dca7]" />
            <p className="text-sm font-medium text-[#364a70] dark:text-[#a4dca7]">{t('legal.privacy.cards.encryptedStorage')}</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-4 text-center">
            <Eye className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{t('legal.privacy.cards.yourDataYourControl')}</p>
          </div>
          <div className="rounded-lg border border-purple-100 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/30 p-4 text-center">
            <FileText className="mx-auto mb-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">{t('legal.privacy.cards.gdprInspired')}</p>
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

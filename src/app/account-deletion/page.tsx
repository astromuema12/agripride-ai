'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShieldCheck, Clock, Mail, FileText, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const sections = [
  {
    title: 'How to Request Account Deletion',
    content: 'You can request the deletion of your AgriPride AI account and associated personal data by sending an email from the email address registered with your account. Send your deletion request to musauedwin2004@gmail.com with the subject line "Account Deletion Request".',
  },
  {
    title: 'Information Required for Deletion',
    content: 'To process your deletion request, we require the following information: your full name, the email address associated with your account, and your account username (if applicable). This information is necessary to verify your identity and locate your account in our systems. We may also request additional verification if we are unable to confirm your identity from the provided information.',
  },
  {
    title: 'Data That Will Be Deleted',
    content: 'Upon approval of your deletion request, the following data will be permanently deleted from our systems: your account profile information (name, email address, phone number), farm profiles and location data, crop records and disease diagnosis history, AI analysis results and recommendations, communication preferences and notification settings, support ticket history, and session and authentication tokens.',
  },
  {
    title: 'Data That May Be Retained',
    content: 'Certain data may be retained for legal, regulatory, and legitimate business purposes even after account deletion. This includes: transaction records and payment history required for accounting and tax compliance (retained for the period required by applicable law, typically 5-7 years), aggregated and anonymized data that no longer identifies you personally (retained for research and analytics), and records of your deletion request itself for verification and audit purposes. Any retained data will be securely stored and access will be strictly limited to authorized personnel with a legitimate need.',
  },
  {
    title: 'Processing Timeline',
    content: 'We will process your account deletion request within 7 business days from the date we receive a complete and verifiable request. During this period, we will verify your identity, identify all data associated with your account, process the deletion of deletable data, and send you a confirmation email once the process is complete. If we require additional information to process your request, the timeline will be paused until we receive the requested information.',
  },
  {
    title: 'Important Notes',
    content: 'Once your account is deleted, all access to AgriPride AI services associated with your account will be permanently revoked. This action is irreversible and cannot be undone. If you have an active paid subscription, cancellation of your subscription should be handled separately before requesting account deletion, or it will be cancelled as part of the deletion process without a refund for the remaining billing period. We recommend downloading any important data or reports before submitting your deletion request.',
  },
  {
    title: 'Contact Information',
    content: 'For questions or concerns about account deletion or data handling, please contact us at musauedwin2004@gmail.com. We are committed to addressing any concerns promptly and transparently.',
  },
];

const summaryCards = [
  {
    icon: Trash2,
    title: 'Permanent Deletion',
    description: 'All personal data permanently erased from our systems',
    color: 'border-red-100 bg-red-50/50',
    iconColor: 'text-red-600',
    titleColor: 'text-red-800',
  },
  {
    icon: Clock,
    title: '7 Business Days',
    description: 'Standard processing time for deletion requests',
    color: 'border-amber-100 bg-amber-50/50',
    iconColor: 'text-amber-600',
    titleColor: 'text-amber-800',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Process',
    description: 'Identity verification required before processing',
    color: 'border-emerald-100 bg-emerald-50/50',
    iconColor: 'text-emerald-600',
    titleColor: 'text-emerald-800',
  },
];

export default function AccountDeletionPage() {
  useEffect(() => {
    document.title = 'Account Deletion Policy | AgriPride AI';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[var(--background)] dark:to-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">
            <Trash2 className="mr-1 h-3 w-3" />
            Account Deletion Policy
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-[var(--foreground)]">Account Deletion Policy</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-[var(--muted-foreground)]">
            Last updated: June 2026. Learn how to delete your AgriPride AI account and what happens to your data.
          </p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {summaryCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className={`rounded-lg border ${card.color} p-4 text-center`}>
                <Icon className={`mx-auto mb-2 h-6 w-6 ${card.iconColor}`} />
                <p className={`text-sm font-medium ${card.titleColor}`}>{card.title}</p>
                <p className="mt-1 text-xs text-gray-500">{card.description}</p>
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
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                  <Mail className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-[var(--foreground)]">Ready to submit a request?</h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-[var(--muted-foreground)]">
                    Send an email from your registered account to{' '}
                    <a href="mailto:musauedwin2004@gmail.com" className="font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300">
                      musauedwin2004@gmail.com
                    </a>{' '}
                    with the subject line &quot;Account Deletion Request&quot; and we will process your request within 7 business days.
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

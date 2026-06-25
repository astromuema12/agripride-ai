'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sections = [
  {
    title: 'Information We Collect',
    content: 'We collect information you provide directly when you create an account or use our services, including: your name, email address, phone number, farm location and size, crop types and planting data, images and descriptions you submit for AI disease diagnosis, and communication preferences. We also automatically collect certain usage data when you interact with the Platform, including pages visited, features used, interaction timestamps, device information, browser type, and IP address. We use cookies and similar tracking technologies as described in the Cookies section below.',
  },
  {
    title: 'How We Use Your Information',
    content: 'We use the information we collect for the following purposes: to provide, maintain, and improve our AI-powered agricultural services; to personalize your experience and deliver relevant content, weather alerts, and farming recommendations; to process and respond to your support requests and inquiries; to send important service-related communications, including security updates and policy changes; to detect, prevent, and address technical issues, fraud, and abuse; to comply with applicable legal obligations; and to improve our AI models using anonymized and aggregated data.',
  },
  {
    title: 'AI Processing & Data',
    content: 'Crop images and symptom descriptions you submit for AI diagnosis are processed by our machine learning models to generate treatment recommendations and crop health assessments. This data may be used to improve our AI models, but will be anonymized and aggregated such that it no longer identifies you personally. You have the right to withdraw consent for AI processing of your data at any time through your account settings. Withdrawal of consent will not affect the lawfulness of processing based on consent before its withdrawal.',
  },
  {
    title: 'Cookies and Analytics',
    content: 'We use essential cookies that are necessary for the operation and security of the Platform, including authentication cookies and session management. We also use analytics cookies (via third-party analytics services) to understand how users interact with the Platform, which helps us improve functionality and user experience. You can control cookie preferences through your browser settings. Disabling certain cookies may affect the functionality of the Platform. We do not use cookies for targeted advertising purposes.',
  },
  {
    title: 'Data Sharing and Third-Party Services',
    content: 'We do not sell, trade, or rent your personal data to third parties. We may share anonymized, aggregated data that no longer identifies you personally with research partners, academic institutions, and agricultural organizations to advance agricultural AI research and improve farming outcomes in Africa. We use third-party service providers to operate and maintain the Platform, including cloud hosting (Supabase), payment processing (Paystack), and AI model APIs. These providers process your data under strict confidentiality agreements and only for the purposes we specify. We require all third-party service providers to implement appropriate security measures to protect your data.',
  },
  {
    title: 'Data Security',
    content: 'We take the security of your data seriously. We implement industry-standard technical and organizational security measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. These measures include: encryption of data in transit using TLS/SSL protocols; encryption of data at rest using industry-standard encryption algorithms; row-level security in our database to ensure users can only access their own data; regular security audits and vulnerability assessments; strict access controls limiting data access to authorized personnel only; and secure authentication mechanisms including password hashing and session management.',
  },
  {
    title: 'Data Retention',
    content: 'We retain your personal data for as long as your account is active and for a reasonable period thereafter to allow for account reactivation. Upon account deletion, your personal data is permanently deleted or anonymized within 30 days, subject to legal retention requirements. Aggregated, anonymized data that no longer identifies you may be retained indefinitely for research, analytics, and AI model training purposes. Transaction records and payment data are retained for the period required by applicable financial and tax regulations.',
  },
  {
    title: 'Your Rights',
    content: 'You have the following rights regarding your personal data: the right to access your personal data held by us; the right to correct inaccurate or incomplete data; the right to delete your account and associated personal data ("right to be forgotten"); the right to export your data in a portable format; the right to withdraw consent for AI processing at any time; the right to object to or restrict certain processing activities; and the right to lodge a complaint with the Office of the Data Protection Commissioner (Kenya) or your local data protection authority. To exercise any of these rights, please contact us at musauedwin2004@gmail.com.',
  },
  {
    title: 'Contact Us',
    content: 'If you have any questions, concerns, or requests regarding this Privacy Policy or our data handling practices, please contact our Data Protection team at musauedwin2004@gmail.com. You may also write to us at: AgriPride AI Ltd, Nairobi, Kenya. We are committed to resolving any privacy concerns promptly and transparently, and will respond to your inquiry within 30 days.',
  },
  {
    title: 'Changes to This Policy',
    content: 'We may update this Privacy Policy from time to time to reflect changes in our practices, legal requirements, or operational needs. Material changes will be posted on this page with an updated "Last updated" date, and we will notify you via email or through a prominent notice on the Platform. We encourage you to review this Privacy Policy periodically. Your continued use of the Platform after changes are posted constitutes your acceptance of the updated policy.',
  },
];

export default function PrivacyPage() {
  useEffect(() => {
    document.title = 'Privacy Policy | AgriPride AI';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[var(--background)] dark:to-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">
            <Shield className="mr-1 h-3 w-3" />
            Privacy Policy
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-[var(--foreground)]">Privacy Policy</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-[var(--muted-foreground)]">
            Last updated: June 2026. At AgriPride AI, we take your privacy seriously.
          </p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 p-4 text-center">
            <Lock className="mx-auto mb-2 h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Encrypted Storage</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30 p-4 text-center">
            <Eye className="mx-auto mb-2 h-6 w-6 text-blue-600 dark:text-blue-400" />
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">Your Data, Your Control</p>
          </div>
          <div className="rounded-lg border border-purple-100 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/30 p-4 text-center">
            <FileText className="mx-auto mb-2 h-6 w-6 text-purple-600 dark:text-purple-400" />
            <p className="text-sm font-medium text-purple-800 dark:text-purple-300">GDPR-Inspired Compliance</p>
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

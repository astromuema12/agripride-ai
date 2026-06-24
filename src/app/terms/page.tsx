'use client';

import { motion } from 'framer-motion';
import { ScrollText, AlertTriangle, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sections = [
  {
    title: 'Acceptance of Terms',
    content: 'By accessing or using AgriPride AI, you agree to be bound by these Terms of Service. If you do not agree, please do not use the platform.',
  },
  {
    title: 'Service Availability',
    content: 'AgriPride AI is provided "as is" with no guarantees of uninterrupted availability. Features may change as we continue to improve the platform. We appreciate your feedback as we grow.',
  },
  {
    title: 'User Accounts',
    content: 'You are responsible for maintaining the confidentiality of your account credentials. You must provide accurate information during registration. One person per account — sharing accounts is prohibited.',
  },
  {
    title: 'Acceptable Use',
    content: 'You agree to use the platform for lawful agricultural purposes only. You may not: upload malicious content, attempt to breach security, misuse AI features, harass other users, or violate any applicable laws.',
  },
  {
    title: 'AI Advice Disclaimer',
    content: 'AI-generated recommendations are for informational purposes only and should not replace professional agricultural advice from certified extension officers. Always verify AI recommendations with local agricultural experts before implementation.',
  },
  {
    title: 'Intellectual Property',
    content: 'The platform, including its AI models, brand, and content, is owned by AgriPride AI. You retain ownership of your farm data and crop images. You grant us a license to process your data for providing services and improving our AI.',
  },
  {
    title: 'Limitation of Liability',
    content: 'AgriPride AI shall not be liable for indirect, incidental, or consequential damages resulting from use of the platform. Total liability is limited to the amount paid for services in the preceding 12 months.',
  },
  {
    title: 'Service Modifications',
    content: 'We reserve the right to modify, suspend, or discontinue any feature of the platform with reasonable notice. Paid subscribers will receive at least 30 days notice of significant changes.',
  },
  {
    title: 'Termination',
    content: 'We may suspend or terminate accounts that violate these terms. You may terminate your account at any time. Upon termination, your data will be deleted within 30 days.',
  },
  {
    title: 'Governing Law',
    content: 'These terms are governed by the laws of the Republic of Kenya. Any disputes shall be resolved through arbitration in Nairobi, Kenya.',
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">
            <ScrollText className="mr-1 h-3 w-3" />
            Terms of Service
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900">Terms of Service</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500">
            Last updated: June 2026. Please read these terms carefully before using AgriPride AI.
          </p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-4 text-center">
            <AlertTriangle className="mx-auto mb-2 h-6 w-6 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">Terms of Service Apply</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">Your Data Stays Yours</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-center">
            <ScrollText className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">Kenya Law Applies</p>
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
              <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              <p className="mt-2 leading-relaxed text-gray-600">{section.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

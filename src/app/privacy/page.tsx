'use client';

import { motion } from 'framer-motion';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sections = [
  {
    title: 'Information We Collect',
    content: `We collect information you provide directly: name, email address, phone number, farm location, crop data, and images you upload for disease diagnosis. We also automatically collect usage data including pages visited, features used, and interaction timestamps.`,
  },
  {
    title: 'How We Use Your Information',
    content: `Your data is used to: provide and improve our AI-powered agricultural services, personalize your experience, send weather alerts and recommendations, process your support requests, and comply with legal obligations.`,
  },
  {
    title: 'AI Processing & Data',
    content: `Crop images and symptom descriptions submitted for AI diagnosis are processed to generate treatment recommendations. This data may be used to improve our AI models, but will be anonymized and aggregated. You can revoke AI processing consent at any time in your settings.`,
  },
  {
    title: 'Data Sharing & Third Parties',
    content: `We do not sell your personal data. We may share anonymized, aggregated data with research partners to improve agricultural AI. Service providers (cloud hosting, AI APIs) process data under strict confidentiality agreements.`,
  },
  {
    title: 'Data Storage & Security',
    content: `Your data is stored securely using encryption at rest and in transit. We use Supabase for database hosting with row-level security ensuring you can only access your own data. We implement industry-standard security measures including regular audits and access controls.`,
  },
  {
    title: 'Your Rights',
    content: `You have the right to: access your personal data, correct inaccurate data, delete your account and associated data, export your data, withdraw consent for AI processing, and lodge a complaint with relevant data protection authorities.`,
  },
  {
    title: 'Data Retention',
    content: `We retain your data for as long as your account is active. Upon account deletion, personal data is deleted within 30 days. Aggregated anonymized data may be retained for research purposes.`,
  },
  {
    title: 'Cookies',
    content: `We use essential cookies for authentication and security. Analytics cookies help us improve the platform. You can manage cookie preferences in your browser settings. See our Cookie Policy for details.`,
  },
  {
    title: 'Contact Us',
    content: `For privacy-related inquiries, contact us at: hello@agripride.ai. We are committed to resolving any privacy concerns promptly.`,
  },
  {
    title: 'Changes to This Policy',
    content: `We may update this policy periodically. Significant changes will be notified via email or platform notice. Continued use after changes constitutes acceptance of the updated policy.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">
            <Shield className="mr-1 h-3 w-3" />
            Privacy Policy
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900">Privacy Policy</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500">
            Last updated: June 2026. At AgriPride AI, we take your privacy seriously.
          </p>
        </motion.div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-4 text-center">
            <Lock className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
            <p className="text-sm font-medium text-emerald-800">Encrypted Storage</p>
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-center">
            <Eye className="mx-auto mb-2 h-6 w-6 text-blue-600" />
            <p className="text-sm font-medium text-blue-800">Your Data, Your Control</p>
          </div>
          <div className="rounded-lg border border-purple-100 bg-purple-50/50 p-4 text-center">
            <FileText className="mx-auto mb-2 h-6 w-6 text-purple-600" />
            <p className="text-sm font-medium text-purple-800">GDPR-Inspired Compliance</p>
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

'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, AlertTriangle, CheckCircle, CreditCard, RefreshCw, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sections = [
  {
    title: 'Acceptance of Terms',
    content: 'By accessing or using AgriPride AI ("the Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to all of these Terms, you must not access or use the Platform. These Terms apply to all visitors, users, and others who access or use the Platform. We reserve the right to update these Terms at any time, and your continued use of the Platform after changes are posted constitutes your acceptance of the updated Terms.',
  },
  {
    title: 'User Accounts',
    content: 'To access certain features of the Platform, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to provide accurate, current, and complete information during registration and to update such information as needed. You must not share your account credentials with others or allow any third party to access your account. One person per account is permitted; sharing accounts across multiple users is strictly prohibited. You must notify us immediately of any unauthorized use of your account at musauedwin2004@gmail.com.',
  },
  {
    title: 'Acceptable Use',
    content: 'You agree to use the Platform solely for lawful agricultural and farming-related purposes. You may not: (a) upload, post, or transmit any malicious code, viruses, or harmful content; (b) attempt to gain unauthorized access to any part of the Platform or its systems; (c) misuse or abuse any AI features, including submitting inappropriate or harmful content for analysis; (d) harass, abuse, or harm other users; (e) violate any applicable local, national, or international laws or regulations; (f) use the Platform for any illegal or unauthorized purpose; or (g) interfere with or disrupt the integrity or performance of the Platform. We reserve the right to investigate and take appropriate legal action against any violation of this section.',
  },
  {
    title: 'Payments and Subscriptions',
    content: 'Certain features of the Platform require payment of fees. By subscribing to a paid plan, you agree to pay all fees associated with your selected subscription tier. All payments are processed securely through our third-party payment processor, Paystack. Subscription fees are billed in advance on a monthly or annual basis, depending on your selected plan. Payments are non-refundable except as expressly stated in our refund policy. Your subscription will automatically renew at the end of each billing period unless you cancel at least 24 hours before the renewal date. We may change our fees with 30 days notice. Price changes will apply to your next billing cycle. You are responsible for providing accurate and complete payment information.',
  },
  {
    title: 'AI Advice Disclaimer',
    content: 'AI-generated recommendations, disease diagnoses, and farming advice provided through the Platform are for informational and reference purposes only. They are based on machine learning models and may not be accurate for all situations, regions, or crop varieties. AI recommendations should not replace professional agricultural advice from certified extension officers, agronomists, or local agricultural experts. Always verify AI-generated recommendations with local agricultural experts before implementation. AgriPride AI expressly disclaims any liability for crop loss, damage, or other adverse outcomes resulting from reliance on AI-generated recommendations.',
  },
  {
    title: 'Intellectual Property',
    content: 'The Platform, including but not limited to its AI models, algorithms, software, brand name, logo, design, text, graphics, and all content not uploaded by users, is the exclusive property of AgriPride AI and is protected by Kenyan and international intellectual property laws. You retain full ownership of your farm data, crop images, and any other content you upload or submit to the Platform ("User Content"). By submitting User Content, you grant AgriPride AI a non-exclusive, royalty-free, worldwide license to process, store, and use your User Content solely for the purpose of providing and improving the Platform\'s services. We will not use your User Content for purposes unrelated to the Platform without your explicit consent.',
  },
  {
    title: 'Service Availability',
    content: 'AgriPride AI is provided on an "as is" and "as available" basis. We strive to maintain high availability but do not guarantee uninterrupted or error-free access to the Platform. We reserve the right to perform maintenance, upgrades, or modifications that may temporarily affect availability. We will make reasonable efforts to notify users in advance of scheduled maintenance. Features and functionality may evolve as we continue to improve the Platform. We are not liable for any loss, damage, or inconvenience caused by service interruptions or downtime.',
  },
  {
    title: 'Limitation of Liability',
    content: 'To the maximum extent permitted by applicable law, AgriPride AI, its directors, employees, partners, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from: (a) your use or inability to use the Platform; (b) any conduct or content of any third party on the Platform; (c) unauthorized access, use, or alteration of your transmissions or content; or (d) any other matter relating to the Platform. Our total liability to you for any claim arising out of or relating to these Terms or the Platform shall not exceed the total amount paid by you to AgriPride AI in the twelve (12) months preceding the event giving rise to the liability.',
  },
  {
    title: 'Changes to Terms',
    content: 'We reserve the right to modify or replace these Terms at any time at our sole discretion. Material changes will be effective 30 days after we post the updated Terms on the Platform. We will make reasonable efforts to notify you of material changes via email or through a prominent notice on the Platform. Your continued use of the Platform after the effective date of any changes constitutes your acceptance of the new Terms. If you do not agree to the updated Terms, you must stop using the Platform and may terminate your account. It is your responsibility to review these Terms periodically for changes.',
  },
  {
    title: 'Termination',
    content: 'We may suspend or terminate your account and access to the Platform at any time, without prior notice or liability, if you violate these Terms. Upon termination, your right to use the Platform will immediately cease. You may terminate your account at any time through your account settings or by contacting us. Upon termination, your personal data will be deleted or anonymized within 30 days, subject to any legal retention requirements. Provisions of these Terms that by their nature should survive termination shall survive, including but not limited to intellectual property provisions, limitation of liability, and governing law.',
  },
  {
    title: 'Governing Law',
    content: 'These Terms shall be governed by and construed in accordance with the laws of the Republic of Kenya. Any disputes, claims, or controversies arising out of or relating to these Terms or the Platform shall be resolved through binding arbitration in Nairobi, Kenya. The arbitration shall be conducted in English by a single arbitrator appointed in accordance with the rules of the Nairobi Centre for International Arbitration. Each party shall bear its own costs and attorneys\' fees.',
  },
  {
    title: 'Contact Information',
    content: 'If you have any questions, concerns, or requests regarding these Terms, please contact us at musauedwin2004@gmail.com. You may also write to us at: AgriPride AI Ltd, Nairobi, Kenya. We will respond to your inquiry as promptly as possible.',
  },
];

export default function TermsPage() {
  useEffect(() => {
    document.title = 'Terms of Service | AgriPride AI';
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-[var(--background)] dark:to-[var(--background)]">
      <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
          <Badge variant="primary" className="mb-4">
            <ScrollText className="mr-1 h-3 w-3" />
            Terms of Service
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-[var(--foreground)]">Terms of Service</h1>
          <p className="mx-auto mt-3 max-w-2xl text-gray-500 dark:text-[var(--muted-foreground)]">
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-[var(--foreground)]">{section.title}</h2>
              <p className="mt-2 leading-relaxed text-gray-600 dark:text-[var(--muted-foreground)]">{section.content}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

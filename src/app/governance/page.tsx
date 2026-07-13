'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { motion } from 'framer-motion';
import {
  Shield, Eye, Lock, GitBranch, CheckCircle,
  AlertTriangle, FileSearch, Clock, BrainCircuit,
  ScrollText, Server, Key, Users, Split,
} from 'lucide-react';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface Framework {
  acronym: string;
  name: string;
  description: string;
  implementation: string;
  principles: string[];
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  gradient: string;
}

interface Decision {
  id: string;
  source_data: string;
  confidence_score: number;
  timestamp: string;
  responsible_agent: string;
  framework: string;
  status: 'approved' | 'pending' | 'flagged';
}

const frameworks: Framework[] = [
  {
    acronym: 'AIM',
    name: 'Accountability in AI Model Management',
    description: 'Ensures every AI model deployed in the platform is traceable to its training data, versioned, and accountable to a human overseer.',
    implementation: 'All AI agents register their model versions with the governance layer. Each prediction includes the model ID, training snapshot hash, and a human-in-the-loop escalation path for low-confidence results.',
    principles: ['Model Versioning', 'Human Oversight', 'Training Traceability', 'Confidence Thresholds'],
    icon: BrainCircuit,
    color: 'text-[#2d6a4f]',
    gradient: 'from-[#2d6a4f] to-[#1a3a2a]',
  },
  {
    acronym: 'MAP',
    name: 'Model Audit & Provenance',
    description: 'Provides a complete audit trail for every model decision — from data ingestion through inference — ensuring full provenance and regulatory compliance.',
    implementation: 'Every API call to AI services is logged with input hashes, output signatures, model parameters, and timestamps. These logs feed the centralized audit system and are immutable once written.',
    principles: ['Full Audit Trail', 'Input/Output Hashing', 'Regulatory Compliance', 'Immutable Logs'],
    icon: FileSearch,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    acronym: '4D',
    name: 'Data-Driven Decision Framework',
    description: 'Governs how data is collected, validated, transformed, and used in decision-making to prevent bias and ensure data quality.',
    implementation: 'Data pipelines enforce schema validation at ingress, quality scoring at each transformation stage, and bias detection checks before data reaches training or inference pipelines.',
    principles: ['Data Validation', 'Bias Detection', 'Quality Scoring', 'Pipeline Governance'],
    icon: Split,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    acronym: 'TRACK',
    name: 'Transparency, Responsibility, Accountability, Compliance, Knowledge',
    description: 'A five-pillar framework that operationalises ethical AI by making every decision transparent, assignable, compliant, and well-documented.',
    implementation: 'Each recommendation exposes its reasoning chain, assigned human responsible party, compliance tag (e.g. GDPR, local agri-regs), and links to relevant knowledge base articles.',
    principles: ['Transparency', 'Responsibility', 'Accountability', 'Compliance', 'Knowledge'],
    icon: ScrollText,
    color: 'text-amber-600',
    gradient: 'from-amber-500 to-amber-600',
  },
  {
    acronym: 'OASIS',
    name: 'Ownership, Access, Security, Informed Consent, Stewardship',
    description: 'Protects farmer and stakeholder data through strict ownership models, role-based access, encryption, and revocable consent.',
    implementation: 'All personal and farm data is tagged with ownership metadata. Access is enforced via RBAC with row-level security. Consent records are stored immutably and checked before every AI processing operation.',
    principles: ['Data Ownership', 'Access Control', 'Security', 'Informed Consent', 'Stewardship'],
    icon: Lock,
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
  },
  {
    acronym: 'RANK',
    name: 'Role Separation, Authority Boundaries, Need-To-Know Communication, Shared Knowledge Layer',
    description: 'Defines strict boundaries between system roles (farmer, officer, admin, AI agent) while enabling a shared knowledge layer for collaboration.',
    implementation: 'Each user role has a bounded set of permissions. AI agents operate in isolated contexts but contribute insights to a shared, access-controlled knowledge graph that spans the platform.',
    principles: ['Role Separation', 'Authority Boundaries', 'Need-To-Know', 'Shared Knowledge'],
    icon: Users,
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  {
    acronym: 'TRAIL',
    name: 'Traceability, Reliability, Auditability, Integrity, Limits',
    description: 'Ensures every AI-driven action can be traced back to its source, independently verified, and constrained within safe operational limits.',
    implementation: 'Decision chains are recorded as directed acyclic graphs (DAGs) from trigger to action. Reliability scores are computed per agent. Integrity checksums verify data hasn\'t been tampered with. Hard and soft limits prevent unsafe actions.',
    principles: ['Traceability', 'Reliability', 'Auditability', 'Integrity', 'Limits'],
    icon: GitBranch,
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    acronym: 'HORIZON',
    name: 'Holistic Oversight & Risk Intelligence Zone',
    description: 'A strategic framework that continuously monitors the AI ecosystem for emerging risks, drift, and policy violations using dashboard-level intelligence.',
    implementation: 'A dedicated governance dashboard aggregates risk scores, model drift metrics, policy violation alerts, and compliance status across all active AI agents and data pipelines in real time.',
    principles: ['Risk Monitoring', 'Drift Detection', 'Policy Enforcement', 'Real-time Alerts'],
    icon: Eye,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600',
  },
];

const recentDecisions: Decision[] = [
  { id: 'D001', source_data: 'Maize leaf image — Farm KAL-042', confidence_score: 94.2, timestamp: '2026-06-03T08:23:00Z', responsible_agent: 'Crop Disease Agent (v2.4)', framework: 'AIM, TRACK', status: 'approved' },
  { id: 'D002', source_data: 'Weather feed — Western Region', confidence_score: 88.7, timestamp: '2026-06-03T07:55:00Z', responsible_agent: 'Weather Intelligence Agent', framework: 'MAP, HORIZON', status: 'approved' },
  { id: 'D003', source_data: 'Soil sample S-8821 — pH & NPK', confidence_score: 96.1, timestamp: '2026-06-03T07:12:00Z', responsible_agent: 'Soil Health Agent (v3.1)', framework: '4D, TRAIL', status: 'approved' },
  { id: 'D004', source_data: 'Pesticide recommendation request — Farm MAC-019', confidence_score: 72.5, timestamp: '2026-06-03T06:40:00Z', responsible_agent: 'Crop Advisory Agent', framework: 'TRACK, RANK', status: 'flagged' },
  { id: 'D005', source_data: 'Consent renewal — Farmer J. Mwangi', confidence_score: 100, timestamp: '2026-06-03T05:30:00Z', responsible_agent: 'Consent Management Service', framework: 'OASIS', status: 'approved' },
  { id: 'D006', source_data: 'Satellite imagery — Rift Valley region', confidence_score: 91.3, timestamp: '2026-06-02T23:15:00Z', responsible_agent: 'Disease Surveillance Agent', framework: 'AIM, MAP, HORIZON', status: 'approved' },
  { id: 'D007', source_data: 'Yield prediction input — Farm NAK-107', confidence_score: 85.9, timestamp: '2026-06-02T21:00:00Z', responsible_agent: 'Yield Prediction Agent', framework: '4D, TRAIL', status: 'pending' },
  { id: 'D008', source_data: 'Irrigation schedule — Farm KSM-203', confidence_score: 79.8, timestamp: '2026-06-02T18:45:00Z', responsible_agent: 'Irrigation Agent (v1.2)', framework: 'TRACK, RANK', status: 'approved' },
];

function timeAgo(dateStr: string, t: (key: string, params?: Record<string, string | number>) => string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('common.justNow');
  if (mins < 60) return t('common.minutesAgo', { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('common.hoursAgo', { count: hours });
  const days = Math.floor(hours / 24);
  return t('common.daysAgo', { count: days });
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' as const },
  },
};

const frameworkCardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { delay: i * 0.05, duration: 0.35, ease: 'easeOut' as const },
  }),
};

function FrameworkCard({ framework, index }: { framework: Framework; index: number }) {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);
  const Icon = framework.icon;

  return (
    <motion.div
      custom={index}
      variants={frameworkCardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card
        className="group cursor-pointer overflow-hidden border-[var(--border)] transition-shadow duration-200 hover:shadow-lg"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Gradient Top Accent */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${framework.gradient}`} />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-[var(--muted)] p-2.5 ring-1 ring-[var(--border)] ${framework.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-[var(--foreground)]">
                  <span className={`font-bold ${framework.color}`}>{framework.acronym}</span>
                  {' '}
                  <span className="font-normal text-[var(--muted-foreground)]">|</span>{' '}
                  {framework.name}
                </CardTitle>
              </div>
            </div>
            <Badge variant="outline" className={`shrink-0 border-[var(--border)] text-xs ${framework.color}`}>
              {framework.acronym}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
            {framework.description}
          </p>

          <motion.div
            initial={false}
            animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-[var(--border)] pt-3">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]/60">
                  {t('governance.systemImplementation')}
                </p>
                <p className="text-sm leading-relaxed text-[var(--muted-foreground)]">
                  {framework.implementation}
                </p>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]/60">
                  {t('governance.corePrinciples')}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {framework.principles.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-md bg-[var(--muted)] px-2 py-1 text-xs font-medium text-[var(--muted-foreground)] ring-1 ring-[var(--border)]"
                    >
                      <CheckCircle className={`h-3 w-3 ${framework.color}`} />
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <button
            className="flex items-center gap-1 text-xs font-medium text-[var(--muted-foreground)]/60 transition-colors hover:text-[var(--muted-foreground)]"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? t('governance.showLess') : t('governance.showDetails')}
            <motion.span
              animate={{ rotate: expanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              ⌄
            </motion.span>
          </button>
        </CardContent>
      </Card>
    </motion.div>
  );
}

const statusConfig: Record<Decision['status'], { labelKey: string; variant: 'primary' | 'warning' | 'destructive'; icon: React.ComponentType<{ className?: string }> }> = {
  approved: { labelKey: 'governance.approved', variant: 'primary', icon: CheckCircle },
  pending: { labelKey: 'governance.pendingReview', variant: 'warning', icon: Clock },
  flagged: { labelKey: 'governance.flagged', variant: 'destructive', icon: AlertTriangle },
};

function DecisionTable() {
  const { t } = useI18n();
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-[var(--border)] bg-[var(--muted)]">
            <th className="px-4 py-3 font-semibold text-[var(--foreground)]">{t('governance.sourceData')}</th>
            <th className="px-4 py-3 font-semibold text-[var(--foreground)]">{t('governance.confidence')}</th>
            <th className="px-4 py-3 font-semibold text-[var(--foreground)]">{t('common.timestamp')}</th>
            <th className="px-4 py-3 font-semibold text-[var(--foreground)]">{t('governance.responsibleAgent')}</th>
            <th className="px-4 py-3 font-semibold text-[var(--foreground)]">{t('governance.frameworksLabel')}</th>
            <th className="px-4 py-3 font-semibold text-[var(--foreground)]">{t('common.status')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border)]">
          {recentDecisions.map((d, i) => {
            const cfg = statusConfig[d.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.tr
                key={d.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="transition-colors hover:bg-[#f0f5f1]/50"
              >
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-[var(--foreground)]">
                  {d.source_data}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-[var(--border)]">
                      <div
                        className={`h-full rounded-full transition-all ${
                          d.confidence_score >= 90
                            ? 'bg-[#2d6a4f]'
                            : d.confidence_score >= 80
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${d.confidence_score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-[var(--muted-foreground)]">
                      {d.confidence_score}%
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-[var(--muted-foreground)]">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-[var(--muted-foreground)]/60" />
                    {timeAgo(d.timestamp, t)}
                  </div>
                </td>
                <td className="max-w-[160px] truncate px-4 py-3 text-[var(--muted-foreground)]">
                  {d.responsible_agent}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {d.framework.split(', ').map((fw) => (
                      <span
                        key={fw}
                        className="inline-flex items-center rounded bg-[var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--muted-foreground)] ring-1 ring-[var(--border)]"
                      >
                        {fw}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={cfg.variant} className="flex w-fit items-center gap-1 text-xs">
                    <StatusIcon className="h-3 w-3" />
                    {t(cfg.labelKey)}
                  </Badge>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function GovernancePage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('frameworks');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 sm:space-y-8 px-4 sm:px-0"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight font-body text-[var(--foreground)]">
            {t('governance.title')}
          </h1>
          <p className="mt-1 text-sm font-body text-[var(--muted-foreground)]">
            {t('governance.description')}
          </p>
        </div>
        <Badge variant="primary" className="w-fit shrink-0">
          <Shield className="mr-1 h-3.5 w-3.5" />
          {t('governance.frameworksActive')}
        </Badge>
      </motion.div>

      {/* Governance Stats */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { label: t('governance.activeFrameworks'), value: '8', icon: Shield, color: 'text-[#2d6a4f] bg-[#f0f5f1] dark:text-[#5e9a6b] dark:bg-[#1a2e20]' },
          { label: t('governance.decisionsToday'), value: '47', icon: BrainCircuit, color: 'text-blue-600 bg-blue-50' },
          { label: t('governance.complianceScore'), value: '96%', icon: CheckCircle, color: 'text-cyan-600 bg-cyan-50' },
          { label: t('governance.flaggedActions'), value: '3', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5">
              <div className={`rounded-lg p-2 sm:p-2.5 ${color} shrink-0`}>
                <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-lg sm:text-xl font-bold text-[var(--foreground)]">{value}</div>
                <p className="text-xs text-[var(--muted-foreground)] truncate">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 sm:mb-6 w-full sm:w-auto overflow-x-auto">
            <TabsTrigger value="frameworks" className="flex items-center gap-2 flex-1 sm:flex-initial">
              <Shield className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{t('governance.governanceFrameworks')}</span>
            </TabsTrigger>
            <TabsTrigger value="decisions" className="flex items-center gap-2 flex-1 sm:flex-initial">
              <ScrollText className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{t('governance.aiDecisionsLog')}</span>
            </TabsTrigger>
          </TabsList>

          {/* Frameworks Tab */}
          <TabsContent value="frameworks" className="mt-0">
            <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {frameworks.map((fw, i) => (
                <FrameworkCard key={fw.acronym} framework={fw} index={i} />
              ))}
            </div>
          </TabsContent>

          {/* Decisions Log Tab */}
          <TabsContent value="decisions" className="mt-0 space-y-4 sm:space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ScrollText className="h-4 w-4 text-[#2d6a4f] shrink-0" />
                      {t('governance.recentAiDecisions')}
                    </CardTitle>
                    <CardDescription className="mt-1 text-xs sm:text-sm">
                      {t('governance.aiDecisionsDesc')}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--border)] text-[#2d6a4f] hover:bg-[#f0f5f1] w-full sm:w-auto"
                  >
                    <Server className="mr-1.5 h-3.5 w-3.5" />
                    {t('governance.exportLog')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0 overflow-x-auto">
                <DecisionTable />
              </CardContent>
            </Card>

            {/* Bottom Info Cards */}
            <div className="grid gap-3 sm:gap-4 sm:grid-cols-3">
              <Card className="border-[var(--border)] bg-[#f0f5f1]/50 dark:bg-[#1a2e20]/50">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm text-[var(--foreground)]">
                    <CheckCircle className="h-4 w-4 text-[#2d6a4f]" />
                    {t('governance.fullTraceability')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-xs leading-relaxed text-[#2d6a4f]">
                  {t('governance.fullTraceabilityDesc')}
                </CardContent>
              </Card>
              <Card className="border-amber-100 bg-amber-50/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    {t('governance.lowConfidenceEscalation')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-xs leading-relaxed text-amber-700">
                  {t('governance.lowConfidenceEscalationDesc')}
                </CardContent>
              </Card>
              <Card className="border-blue-100 bg-blue-50/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm text-blue-800">
                    <Key className="h-4 w-4 text-blue-600" />
                    {t('governance.consentFirstProcessing')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-xs leading-relaxed text-blue-700">
                  {t('governance.consentFirstProcessingDesc')}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

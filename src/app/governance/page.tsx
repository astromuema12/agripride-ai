'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Eye, Lock, GitBranch, BookOpen, CheckCircle,
  AlertTriangle, UserCheck, FileSearch, Clock, BrainCircuit,
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
    color: 'text-emerald-600',
    gradient: 'from-emerald-500 to-emerald-600',
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

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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
        className="group cursor-pointer overflow-hidden border-gray-200 transition-shadow duration-200 hover:shadow-lg"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Gradient Top Accent */}
        <div className={`h-1.5 w-full bg-gradient-to-r ${framework.gradient}`} />

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-gray-50 p-2.5 ring-1 ring-gray-200 ${framework.color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base text-gray-900">
                  <span className={`font-bold ${framework.color}`}>{framework.acronym}</span>
                  {' '}
                  <span className="font-normal text-gray-500">|</span>{' '}
                  {framework.name}
                </CardTitle>
              </div>
            </div>
            <Badge variant="outline" className={`shrink-0 border-gray-200 text-xs ${framework.color}`}>
              {framework.acronym}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 pt-0">
          <p className="text-sm leading-relaxed text-gray-600">
            {framework.description}
          </p>

          <motion.div
            initial={false}
            animate={{ height: expanded ? 'auto' : 0, opacity: expanded ? 1 : 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  System Implementation
                </p>
                <p className="text-sm leading-relaxed text-gray-600">
                  {framework.implementation}
                </p>
              </div>
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Core Principles
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {framework.principles.map((p) => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200"
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
            className="flex items-center gap-1 text-xs font-medium text-gray-400 transition-colors hover:text-gray-600"
            onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          >
            {expanded ? 'Show less' : 'Show implementation details'}
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

const statusConfig: Record<Decision['status'], { label: string; variant: 'primary' | 'warning' | 'destructive'; icon: React.ComponentType<{ className?: string }> }> = {
  approved: { label: 'Approved', variant: 'primary', icon: CheckCircle },
  pending: { label: 'Pending Review', variant: 'warning', icon: Clock },
  flagged: { label: 'Flagged', variant: 'destructive', icon: AlertTriangle },
};

function DecisionTable() {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50/80">
            <th className="px-4 py-3 font-semibold text-gray-700">Source Data</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Confidence</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Timestamp</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Responsible Agent</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Frameworks</th>
            <th className="px-4 py-3 font-semibold text-gray-700">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {recentDecisions.map((d, i) => {
            const cfg = statusConfig[d.status];
            const StatusIcon = cfg.icon;
            return (
              <motion.tr
                key={d.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03, duration: 0.25 }}
                className="transition-colors hover:bg-emerald-50/50"
              >
                <td className="max-w-[220px] truncate px-4 py-3 font-medium text-gray-900">
                  {d.source_data}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-12 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full transition-all ${
                          d.confidence_score >= 90
                            ? 'bg-emerald-500'
                            : d.confidence_score >= 80
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                        }`}
                        style={{ width: `${d.confidence_score}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-600">
                      {d.confidence_score}%
                    </span>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-gray-400" />
                    {timeAgo(d.timestamp)}
                  </div>
                </td>
                <td className="max-w-[160px] truncate px-4 py-3 text-gray-600">
                  {d.responsible_agent}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {d.framework.split(', ').map((fw) => (
                      <span
                        key={fw}
                        className="inline-flex items-center rounded bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 ring-1 ring-gray-200"
                      >
                        {fw}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={cfg.variant} className="flex w-fit items-center gap-1 text-xs">
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
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
  const [activeTab, setActiveTab] = useState('frameworks');

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            AI Governance Center
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Enterprise-grade governance frameworks ensuring ethical, transparent, and
            compliant AI operations across AgriPride AI.
          </p>
        </div>
        <Badge variant="primary" className="w-fit">
          <Shield className="mr-1 h-3.5 w-3.5" />
          8 Frameworks Active
        </Badge>
      </motion.div>

      {/* Governance Stats */}
      <motion.div variants={itemVariants} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Active Frameworks', value: '8', icon: Shield, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Decisions Today', value: '47', icon: BrainCircuit, color: 'text-blue-600 bg-blue-50' },
          { label: 'Compliance Score', value: '96%', icon: CheckCircle, color: 'text-cyan-600 bg-cyan-50' },
          { label: 'Flagged Actions', value: '3', icon: AlertTriangle, color: 'text-amber-600 bg-amber-50' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`rounded-lg p-2.5 ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{value}</div>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Main Content Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="frameworks" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Governance Frameworks
            </TabsTrigger>
            <TabsTrigger value="decisions" className="flex items-center gap-2">
              <ScrollText className="h-4 w-4" />
              AI Decisions Log
            </TabsTrigger>
          </TabsList>

          {/* Frameworks Tab */}
          <TabsContent value="frameworks" className="mt-0">
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {frameworks.map((fw, i) => (
                <FrameworkCard key={fw.acronym} framework={fw} index={i} />
              ))}
            </div>
          </TabsContent>

          {/* Decisions Log Tab */}
          <TabsContent value="decisions" className="mt-0 space-y-5">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <ScrollText className="h-4 w-4 text-emerald-500" />
                      Recent AI Decisions
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Every AI-driven decision is logged with its source data, confidence score,
                      responsible agent, and governing frameworks.
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  >
                    <Server className="mr-1.5 h-3.5 w-3.5" />
                    Export Log
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <DecisionTable />
              </CardContent>
            </Card>

            {/* Bottom Info Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card className="border-emerald-100 bg-emerald-50/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm text-emerald-800">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    Full Traceability
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-xs leading-relaxed text-emerald-700">
                  Every decision is linked back to its source data, model version, and human
                  responsible party. No black-box outputs.
                </CardContent>
              </Card>
              <Card className="border-amber-100 bg-amber-50/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Low Confidence Escalation
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-xs leading-relaxed text-amber-700">
                  Decisions below the 80% confidence threshold are automatically flagged for
                  human review before execution.
                </CardContent>
              </Card>
              <Card className="border-blue-100 bg-blue-50/40">
                <CardHeader className="pb-2 pt-4">
                  <CardTitle className="flex items-center gap-2 text-sm text-blue-800">
                    <Key className="h-4 w-4 text-blue-600" />
                    Consent-First Processing
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-4 text-xs leading-relaxed text-blue-700">
                  OASIS framework ensures no farmer data is processed without explicit,
                  revocable consent. All AI operations check consent at runtime.
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}

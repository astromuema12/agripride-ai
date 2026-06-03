'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getRecommendations } from '@/lib/db';
import type { Recommendation } from '@/types';
import { formatDate } from '@/lib/utils';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  ScrollText, BrainCircuit, Shield, Eye, EyeOff, Clock,
} from 'lucide-react';

function TypeBadge({ type }: { type: Recommendation['type'] }) {
  const map: Record<string, { variant: 'primary' | 'destructive' | 'secondary' | 'default'; label: string }> = {
    crop_advisor: { variant: 'primary', label: 'Crop Advisor' },
    disease: { variant: 'destructive', label: 'Disease' },
    weather: { variant: 'secondary', label: 'Weather' },
    general: { variant: 'default', label: 'General' },
  };
  const { variant, label } = map[type] ?? map.general;
  return <Badge variant={variant}>{label}</Badge>;
}

export default function RecommendationsPage() {
  const { user } = useAuth();

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const loadRecommendations = async () => {
    if (!user) return;
    try {
      const data = await getRecommendations(user.id);
      setRecommendations(data);
    } catch {
      toast.error('Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRecommendations(); }, [user]);

  if (!user) return null;

  const filtered = typeFilter === 'all'
    ? recommendations
    : recommendations.filter((r) => r.type === typeFilter);

  const total = recommendations.length;
  const byType = {
    crop_advisor: recommendations.filter((r) => r.type === 'crop_advisor').length,
    disease: recommendations.filter((r) => r.type === 'disease').length,
    weather: recommendations.filter((r) => r.type === 'weather').length,
    general: recommendations.filter((r) => r.type === 'general').length,
  };

  const toggleRead = (id: string) => {
    setReadIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => prev === id ? null : id);
  };

  const typeTabs = [
    { value: 'all', label: `All (${total})` },
    { value: 'crop_advisor', label: `Crop Advisor (${byType.crop_advisor})` },
    { value: 'disease', label: `Disease (${byType.disease})` },
    { value: 'weather', label: `Weather (${byType.weather})` },
    { value: 'general', label: `General (${byType.general})` },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Recommendations</h1>
          <p className="mt-1 text-sm text-gray-500">
            Intelligent insights and suggestions from AI agents
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-5">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-50 p-3">
              <ScrollText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-xl font-bold text-gray-900">{total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-emerald-50 p-3">
              <ScrollText className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Crop Advisor</p>
              <p className="text-xl font-bold text-gray-900">{byType.crop_advisor}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-red-50 p-3">
              <ScrollText className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Disease</p>
              <p className="text-xl font-bold text-gray-900">{byType.disease}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <ScrollText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Weather</p>
              <p className="text-xl font-bold text-gray-900">{byType.weather}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-lg bg-gray-50 p-3">
              <ScrollText className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">General</p>
              <p className="text-xl font-bold text-gray-900">{byType.general}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <Tabs value={typeFilter} onValueChange={setTypeFilter}>
        <TabsList className="flex-wrap h-auto">
          {typeTabs.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={typeFilter} className="mt-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-5 w-48 bg-gray-100 rounded animate-pulse mb-3" />
                    <div className="h-4 w-full bg-gray-100 rounded animate-pulse mb-2" />
                    <div className="h-4 w-3/4 bg-gray-100 rounded animate-pulse" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center py-16 text-center">
                <div className="rounded-full bg-emerald-50 p-4 mb-4">
                  <ScrollText className="h-10 w-10 text-emerald-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {typeFilter === 'all' ? 'No Recommendations' : `No ${typeFilter} recommendations`}
                </h3>
                <p className="text-sm text-gray-500">
                  {typeFilter === 'all'
                    ? 'AI-generated recommendations will appear here.'
                    : 'No recommendations of this type available.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filtered.map((rec) => {
                const isExpanded = expandedId === rec.id;
                const isRead = readIds.has(rec.id) || rec.is_read;
                const confidencePct = rec.confidence_score !== undefined
                  ? Math.round(rec.confidence_score * 100)
                  : null;

                return (
                  <Card
                    key={rec.id}
                    className={`transition-shadow hover:shadow-md ${
                      isRead ? 'opacity-60' : ''
                    }`}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <TypeBadge type={rec.type} />
                          {isRead && (
                            <Badge variant="default" className="text-[10px]">Read</Badge>
                          )}
                          <CardTitle className="text-base truncate">{rec.title}</CardTitle>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRead(rec.id)}
                          title={isRead ? 'Mark as unread' : 'Mark as read'}
                        >
                          {isRead ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className={`text-sm text-gray-600 leading-relaxed ${
                        !isExpanded ? 'line-clamp-2' : ''
                      }`}>
                        {rec.content}
                      </p>
                      {rec.content.length > 150 && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-xs"
                          onClick={() => toggleExpand(rec.id)}
                        >
                          {isExpanded ? 'Show less' : 'Show more'}
                        </Button>
                      )}

                      {/* Confidence */}
                      {confidencePct !== null && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-gray-500">Confidence Score</span>
                            <span className={`text-xs font-medium ${
                              confidencePct >= 80 ? 'text-emerald-600' : confidencePct >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                              {confidencePct}%
                            </span>
                          </div>
                          <Progress value={confidencePct} className="h-1.5" />
                        </div>
                      )}

                      {/* AI Governance */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 border-t border-gray-100 pt-3">
                        {rec.responsible_agent && (
                          <div className="flex items-center gap-1">
                            <Shield className="h-3.5 w-3.5" />
                            <span>{rec.responsible_agent}</span>
                          </div>
                        )}
                        {rec.frameworks && rec.frameworks.length > 0 && (
                          <div className="flex items-center gap-1">
                            <BrainCircuit className="h-3.5 w-3.5" />
                            <span>{rec.frameworks.join(', ')}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span>{formatDate(rec.created_at)}</span>
                        </div>
                      </div>

                      {/* Source Data Toggle */}
                      {rec.source_data && Object.keys(rec.source_data).length > 0 && (
                        <details className="text-xs text-gray-500 border-t border-gray-100 pt-2">
                          <summary className="cursor-pointer hover:text-gray-700 font-medium">
                            Source Data
                          </summary>
                          <pre className="mt-2 rounded-lg bg-gray-50 p-3 overflow-x-auto text-[11px] text-gray-600">
                            {JSON.stringify(rec.source_data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

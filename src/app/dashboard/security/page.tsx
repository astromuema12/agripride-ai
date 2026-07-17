'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n';
import { Shield, Smartphone, Monitor, Globe, Clock, Trash2, CheckCircle2, AlertCircle, Loader2, LogOut } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { getUserSessions, revokeSession, revokeOtherSessions, getCurrentSessionId } from '@/lib/sessions';
import { getUserMfaStatus } from '@/lib/mfa';
import { checkEmailVerified } from '@/lib/email-verification';
import type { UserSession } from '@/types';

export default function SecurityPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const currentUser = user;

    async function load() {
      const [sessionsResult, mfaStatus, emailResult] = await Promise.all([
        getUserSessions(currentUser.id),
        getUserMfaStatus(currentUser.id),
        checkEmailVerified(currentUser.id),
      ]);

      setSessions(sessionsResult.data);
      setMfaEnabled(mfaStatus.enabled);
      setEmailVerified(emailResult.verified);
      setSessionsLoading(false);
    }

    load();
  }, [user]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Shield className="h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">{t('security.notSignedIn')}</p>
        </div>
      </div>
    );
  }

  const handleRevokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    const result = await revokeSession(sessionId);
    setRevoking(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    toast.success(t('security.sessionRevoked'));
  };

  const handleRevokeOtherSessions = async () => {
    const currentId = await getCurrentSessionId();
    if (!currentId) return;

    setRevoking('all');
    const result = await revokeOtherSessions(user.id, currentId);
    setRevoking(null);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    setSessions((prev) => prev.filter((s) => s.session_token === currentId));
    toast.success(t('security.otherSessionsRevoked'));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHr = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMin < 1) return t('common.justNow');
    if (diffMin < 60) return t('common.minutesAgo', { minutes: diffMin });
    if (diffHr < 24) return t('common.hoursAgo', { hours: diffHr });
    if (diffDays < 7) return t('common.daysAgo', { days: diffDays });
    return d.toLocaleDateString(t('weather.locale'), { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('security.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">{t('security.subtitle')}</p>
      </div>

      {/* Authentication Methods */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('security.authenticationMethods')}</CardTitle>
            <CardDescription>{t('security.authenticationMethodsDesc')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-start gap-3">
              <Smartphone className="mt-0.5 h-5 w-5 text-[var(--muted-foreground)]" />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{t('security.mfa')}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{t('security.mfaDesc2')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {mfaEnabled ? (
                <Badge variant="primary" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {t('security.enabled')}
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-200">{t('security.notSetUp')}</Badge>
              )}
              <Button
                variant={mfaEnabled ? 'outline' : 'default'}
                size="sm"
                onClick={() => router.push('/auth/mfa')}
              >
                {mfaEnabled ? t('security.manage') : t('security.setUp')}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-[var(--muted-foreground)]" />
              <div>
                <p className="text-sm font-medium text-[var(--foreground)]">{t('security.emailVerification')}</p>
                <p className="text-xs text-[var(--muted-foreground)]">{user.email}</p>
              </div>
            </div>
            {emailVerified ? (
              <Badge variant="primary" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                {t('security.verified')}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-amber-600 border-amber-200">{t('security.unverified')}</Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            <Monitor className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-lg">{t('security.sessions')}</CardTitle>
            <CardDescription>{t('security.sessionsDesc2')}</CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button variant="outline" size="sm" onClick={handleRevokeOtherSessions} disabled={revoking === 'all'} className="gap-2">
              {revoking === 'all' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogOut className="h-3.5 w-3.5" />}
              {t('security.signOutOthers')}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#0f766e]" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Monitor className="mb-2 h-8 w-8 text-gray-300" />
              <p className="text-sm text-gray-500">{t('security.noSessions')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border border-[var(--border)] p-4 transition-colors hover:bg-[var(--muted)]/50"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`rounded-lg p-2 ${session.is_current ? 'bg-[#e2f0ee] text-[#0f766e] dark:bg-emerald-900/30 dark:text-[#14b8a6]' : 'bg-gray-50 text-gray-400 dark:bg-gray-800/50'}`}>
                      {session.device_type === 'mobile' ? (
                        <Smartphone className="h-5 w-5" />
                      ) : (
                        <Monitor className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-[var(--foreground)] truncate">
                          {session.device_name || t('security.unknownDevice')}
                        </p>
                        {session.is_current && (
                          <Badge variant="primary" className="text-[10px]">{t('security.current')}</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">
                        {session.browser && (
                          <span className="flex items-center gap-1">
                            <Globe className="h-3 w-3" />
                            {session.browser}{session.os ? t('security.sessionOn') + session.os : ''}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(session.last_active_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {!session.is_current && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRevokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="shrink-0 text-[var(--muted-foreground)] hover:text-red-500"
                    >
                      {revoking === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Account Actions */}
      <Card className="border-red-200 dark:border-red-900/50">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-red-50 p-2.5 text-red-600 dark:bg-red-900/30 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg text-red-700 dark:text-red-400">{t('security.dangerZone')}</CardTitle>
            <CardDescription>{t('security.dangerZoneDesc')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 dark:border-red-900 dark:hover:bg-red-900/20"
            onClick={() => router.push('/settings')}
          >
            <Trash2 className="h-4 w-4" />
            {t('security.deleteAccount')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

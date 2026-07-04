'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/lib/i18n';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/db';
import type { Notification } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, CheckCheck, AlertTriangle, CloudSun, ScrollText, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons: Record<string, typeof Bell> = {
  weather_alert: CloudSun,
  disease_alert: AlertTriangle,
  recommendation: ScrollText,
  system: Info,
};

const typeColors: Record<string, string> = {
  weather_alert: 'text-blue-500 bg-blue-50',
  disease_alert: 'text-red-500 bg-red-50',
  recommendation: 'text-emerald-500 bg-emerald-50',
  system: 'text-gray-500 bg-gray-50',
};

export default function NotificationsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getNotifications(user.id).then(({ data }) => {
      setNotifications(data);
      setLoading(false);
    });
  }, [user]);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (!user) return null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('notifications.title')}</h1>
          <p className="text-xs sm:text-sm text-gray-500">
            {unreadCount > 0 ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.noNotificationsDesc')}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="text-xs w-fit">
            <CheckCheck className="mr-1.5 h-3.5 w-3.5" />
            {t('notifications.markAllRead')}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader className="px-3 sm:px-6">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600 shrink-0" />
            <CardTitle className="text-base sm:text-lg">{t('notifications.allNotifications')}</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-auto text-[8px] sm:text-[10px]">{t('notifications.newCount', { count: unreadCount })}</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-3 sm:px-6">
          {loading ? (
            <div className="space-y-2 sm:space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 sm:h-20 w-full" />)}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-8 sm:py-12 text-center">
              <Bell className="mx-auto mb-2 h-8 w-8 sm:h-10 sm:w-10 text-gray-300" />
              <p className="text-xs sm:text-sm text-gray-500">{t('notifications.noNotifications')}</p>
            </div>
          ) : (
            <div className="-mx-3 sm:mx-0 divide-y divide-gray-100">
              {notifications.map((n) => {
                const Icon = typeIcons[n.type] ?? Bell;
                return (
                  <div key={n.id} className={cn('flex items-start gap-3 px-3 sm:px-0 py-3 sm:py-4', !n.is_read && 'bg-emerald-50/30 sm:bg-transparent sm:rounded-none -mx-3 sm:mx-0 px-3 sm:px-0')}>
                    <div className={cn('flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full shrink-0', typeColors[n.type])}>
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <span className={cn('text-xs sm:text-sm font-medium truncate', !n.is_read ? 'text-gray-900' : 'text-gray-600')}>{n.title}</span>
                        {!n.is_read && <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-[10px] sm:text-sm text-gray-500 truncate">{n.message}</p>
                      <p className="mt-0.5 text-[8px] sm:text-xs text-gray-400">
                        {new Date(n.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {!n.is_read && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => handleMarkRead(n.id)}>
                          <CheckCheck className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

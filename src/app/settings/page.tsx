'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogDescription,
} from '@/components/ui/dialog';
import { User, Shield, Bell, Key, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { writeAuditLog } from '@/lib/server-auth';
import { updateUserProfile, updateUserConsent } from '@/lib/db';

const ROLE_KEYS: Record<string, string> = {
  farmer: 'auth.farmer',
  officer: 'auth.officer',
  admin: 'auth.admin',
};

export default function SettingsPage() {
  const { t } = useI18n();
  const { user, isDemoMode } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [email] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [diseaseAlerts, setDiseaseAlerts] = useState(true);
  const [dataCollection, setDataCollection] = useState(true);
  const [aiProcessing, setAiProcessing] = useState(true);
  const [diseaseDiagnosis, setDiseaseDiagnosis] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <User className="h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">{t('settings.mustBeLoggedIn')}</p>
        </div>
      </div>
    );
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      await updateUserProfile(user.id, { name });
      toast.success(t('settings.profileUpdated'));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      writeAuditLog({
        user_id: user.id,
        action: 'update_profile',
        resource: 'settings',
        details: { name },
      }).catch(() => {});
    } catch {
      toast.error(t('settings.failedToSaveProfile'));
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordsDoNotMatch'));
      return;
    }
    if (newPassword.length < 8) {
      toast.error(t('settings.passwordMinLength'));
      return;
    }
    try {
      if (isSupabaseConfigured && supabase) {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          toast.error(error.message || t('settings.failedToSaveProfile'));
          return;
        }
      }
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('settings.passwordUpdated'));
      writeAuditLog({
        user_id: user.id,
        action: 'change_password',
        resource: 'settings',
      }).catch(() => {});
    } catch {
      toast.error(t('settings.failedToSaveProfile'));
    }
  }

  async function handleConsentChange(type: string, granted: boolean) {
    if (!user) return;
    try {
      await updateUserConsent(user.id, type as any, granted);
      toast.success(t('settings.consentUpdated', { type: type.replace(/_/g, ' '), status: granted ? t('consent.granted') : t('consent.revoked') }));
      writeAuditLog({
        user_id: user.id,
        action: granted ? 'consent_granted' : 'consent_revoked',
        resource: 'consent',
        details: { type },
      }).catch(() => {});
    } catch {
      toast.error(t('settings.failedToUpdateConsent'));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="mt-1 text-sm text-gray-500">
          {t('settings.description')}
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-[#e2f0ee] p-2.5 text-[#0f766e]">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings.profileSection')}</CardTitle>
            <CardDescription>{t('settings.profileSectionDesc')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">{t('settings.fullName')}</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <Input id="email" value={email} disabled className="text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">{t('common.type')}:</span>
              <Badge variant="primary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {t(ROLE_KEYS[user.role] ?? 'common.unknown')}
              </Badge>
            </div>
            <Button type="submit" size="sm">
              {saved ? t('common.saved') : t('common.save')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2.5 text-blue-600">
            <Key className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings.passwordSection')}</CardTitle>
            <CardDescription>{t('settings.passwordSectionDesc')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">{t('settings.currentPassword')}</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings.currentPasswordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">{t('settings.newPassword')}</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.newPasswordPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                />
              </div>
            </div>
            <Button type="submit" size="sm" variant="outline">
              {t('settings.updatePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-amber-50 p-2.5 text-amber-600">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings.notificationsSection')}</CardTitle>
            <CardDescription>{t('settings.notificationsSectionDesc')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.emailNotifications')}</p>
              <p className="text-xs text-gray-500">{t('settings.emailNotificationsDesc')}</p>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.weatherAlerts')}</p>
              <p className="text-xs text-gray-500">{t('settings.weatherAlertsDesc')}</p>
            </div>
            <Switch checked={weatherAlerts} onCheckedChange={setWeatherAlerts} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.diseaseAlerts')}</p>
              <p className="text-xs text-gray-500">{t('settings.diseaseAlertsDesc')}</p>
            </div>
            <Switch checked={diseaseAlerts} onCheckedChange={setDiseaseAlerts} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2.5 text-purple-600">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">{t('settings.consentSection')}</CardTitle>
            <CardDescription>{t('settings.consentSectionDesc')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('consent.type.data_collection')}</p>
              <p className="text-xs text-gray-500">{t('settings.dataCollectionDesc')}</p>
            </div>
            <Switch checked={dataCollection} onCheckedChange={(v) => { setDataCollection(v); handleConsentChange('data_collection', v); }} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('consent.type.ai_processing')}</p>
              <p className="text-xs text-gray-500">{t('settings.aiProcessingDesc')}</p>
            </div>
            <Switch checked={aiProcessing} onCheckedChange={(v) => { setAiProcessing(v); handleConsentChange('ai_processing', v); }} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('consent.type.disease_diagnosis')}</p>
              <p className="text-xs text-gray-500">{t('settings.diseaseDiagnosisDesc')}</p>
            </div>
            <Switch checked={diseaseDiagnosis} onCheckedChange={(v) => { setDiseaseDiagnosis(v); handleConsentChange('disease_diagnosis', v); }} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card className="border-red-200">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-red-50 p-2.5 text-red-600">
            <Trash2 className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg text-red-700">{t('settings.dangerZone')}</CardTitle>
            <CardDescription>{t('settings.dangerZoneDesc')}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                {t('settings.deleteAccount')}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('settings.deleteAccountTitle')}</DialogTitle>
                <DialogDescription>
                  {t('settings.deleteAccountDesc')}
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600">
                  {t('settings.deleteAccountConfirm')}
                </p>
                <Input placeholder={t('settings.deleteAccountPlaceholder')} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>
                    {t('common.cancel')}
                  </Button>
                  <Button variant="destructive" size="sm" disabled>
                    {t('settings.deleteMyAccount')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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

const roleLabels: Record<string, string> = {
  farmer: 'Farmer',
  officer: 'Extension Officer',
  admin: 'System Admin',
};

export default function SettingsPage() {
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
          <p className="text-sm font-medium text-gray-500">You must be logged in to view settings.</p>
        </div>
      </div>
    );
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      await updateUserProfile(user.id, { name });
      toast.success('Profile updated successfully');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      writeAuditLog({
        user_id: user.id,
        action: 'update_profile',
        resource: 'settings',
        details: { name },
      }).catch(() => {});
    } catch {
      toast.error('Failed to save profile');
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    toast.success('Password updated (demo mode - no server-side change)');
    writeAuditLog({
      user_id: user.id,
      action: 'change_password',
      resource: 'settings',
    }).catch(() => {});
  }

  async function handleConsentChange(type: string, granted: boolean) {
    if (!user) return;
    try {
      await updateUserConsent(user.id, type as any, granted);
      toast.success(`Consent for ${type.replace(/_/g, ' ')} ${granted ? 'granted' : 'revoked'}`);
      writeAuditLog({
        user_id: user.id,
        action: granted ? 'consent_granted' : 'consent_revoked',
        resource: 'consent',
        details: { type },
      }).catch(() => {});
    } catch {
      toast.error('Failed to update consent');
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account, notifications, and privacy preferences.
        </p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
            <User className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg">Profile</CardTitle>
            <CardDescription>Your personal information and role</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={email} disabled className="text-gray-400" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Role:</span>
              <Badge variant="primary" className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                {roleLabels[user.role] ?? user.role}
              </Badge>
            </div>
            <Button type="submit" size="sm">
              {saved ? 'Saved!' : 'Save Changes'}
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
            <CardTitle className="text-lg">Password</CardTitle>
            <CardDescription>Update your account password</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>
            </div>
            <Button type="submit" size="sm" variant="outline">
              Update Password
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
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>Control what notifications you receive</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive email updates about your account</p>
            </div>
            <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Weather Alerts</p>
              <p className="text-xs text-gray-500">Get notified about severe weather in your area</p>
            </div>
            <Switch checked={weatherAlerts} onCheckedChange={setWeatherAlerts} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Disease Alerts</p>
              <p className="text-xs text-gray-500">Alerts when crop diseases are detected nearby</p>
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
            <CardTitle className="text-lg">Consent Management</CardTitle>
            <CardDescription>Manage how your data is used by AI systems</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Data Collection</p>
              <p className="text-xs text-gray-500">Allow collection of farm and crop data for analytics</p>
            </div>
            <Switch checked={dataCollection} onCheckedChange={(v) => { setDataCollection(v); handleConsentChange('data_collection', v); }} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">AI Processing</p>
              <p className="text-xs text-gray-500">Allow AI agents to process your data for recommendations</p>
            </div>
            <Switch checked={aiProcessing} onCheckedChange={(v) => { setAiProcessing(v); handleConsentChange('ai_processing', v); }} />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Disease Diagnosis</p>
              <p className="text-xs text-gray-500">Allow AI-powered disease detection on crop images</p>
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
            <CardTitle className="text-lg text-red-700">Danger Zone</CardTitle>
            <CardDescription>Irreversible actions for your account</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm" className="gap-2">
                <Trash2 className="h-4 w-4" />
                Delete Account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Your Account</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. All your data, farms, crops, and reports will be permanently removed.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600">
                  Are you sure you want to delete your account? Type <strong>DELETE</strong> below to confirm.
                </p>
                <Input placeholder='Type "DELETE" to confirm' />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" size="sm" disabled>
                    Delete My Account
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

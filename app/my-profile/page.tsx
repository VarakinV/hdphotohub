'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { User as UserIcon, UploadCloud } from 'lucide-react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import { PortalNavbar } from '@/components/portal/portal-navbar';

export default function MyProfilePage() {
  const router = useRouter();
  const { data: session, status, update } = useSession();

  const [name, setName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || '');
      setAvatarUrl((session.user as any).avatarUrl ?? null);
    }
  }, [session]);

  const onPickFile = () => fileInputRef.current?.click();

  const onFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowed.includes(f.type)) {
      toast.error('Please upload JPEG, PNG, or WebP image');
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('File must be < 5MB');
      return;
    }
    setAvatarFile(f);
    const url = URL.createObjectURL(f);
    setAvatarPreview(url);
  };

  async function uploadAvatarIfNeeded(): Promise<string | null | undefined> {
    if (!avatarFile) return undefined;
    try {
      const res = await fetch('/api/user/avatar/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: avatarFile.name,
          fileType: avatarFile.type,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to get upload URL');
      }
      const { uploadUrl, fileUrl } = await res.json();
      const put = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': avatarFile.type,
        },
        body: avatarFile,
      });
      if (!put.ok) {
        const text = await put.text().catch(() => '');
        throw new Error(
          `Upload failed (${put.status}): ${text || put.statusText}`
        );
      }
      return fileUrl as string;
    } catch (e) {
      console.error(e);
      toast.error((e as Error).message);
      return undefined;
    }
  }

  async function saveProfile() {
    try {
      setSavingProfile(true);
      const uploadedUrl = await uploadAvatarIfNeeded();

      const payload: any = {};
      if (name !== (session?.user?.name || '')) payload.name = name;
      if (uploadedUrl !== undefined) payload.avatarUrl = uploadedUrl; // null/undefined handled

      // If user picked a file but upload failed (undefined), stop here (error already shown)
      if (avatarFile && uploadedUrl === undefined) return;

      // Only show "Nothing to update" when no changes AND no picked file
      if (Object.keys(payload).length === 0 && !avatarFile) {
        toast.info('Nothing to update');
        return;
      }

      const res = await fetch('/api/user/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update profile');
      }
      const updated = await res.json();

      // Refresh session values immediately without logout
      await update({
        name: updated.name ?? null,
        avatarUrl: updated.avatarUrl ?? null,
      } as any);

      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        setAvatarFile(null);
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarPreview(null);
      }

      toast.success('Profile updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingProfile(false);
    }
  }

  async function savePassword() {
    if (!currentPassword || !newPassword) {
      toast.error('Please fill all password fields');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match');
      return;
    }
    try {
      setSavingPassword(true);
      const res = await fetch('/api/user/update-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to update password');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated');
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSavingPassword(false);
    }
  }

  if (status === 'loading') {
    return <div className="p-6">Loading...</div>;
  }

  if (!session?.user) return null;

  const displayAvatar = avatarPreview || avatarUrl || null;

  return (
    <div className="min-h-screen bg-gray-50">
      {(session?.user as any)?.role === 'ADMIN' ||
      (session?.user as any)?.role === 'SUPERADMIN' ? (
        <AdminNavbar />
      ) : (
        <PortalNavbar />
      )}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6">My Profile</h1>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-6">
                <div className="flex flex-col items-center gap-3">
                  <Avatar className="size-24">
                    {displayAvatar ? (
                      <AvatarImage src={displayAvatar} alt="Avatar" />
                    ) : (
                      <AvatarFallback>
                        <UserIcon className="h-8 w-8 text-gray-500" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={onFileSelected}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={onPickFile}
                    >
                      <UploadCloud className="h-4 w-4 mr-2" /> Choose Image
                    </Button>
                  </div>
                </div>

                <div className="flex-1 grid gap-4">
                  <div>
                    <label className="text-sm text-gray-600">
                      Display Name
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-end">
                    <Button onClick={saveProfile} disabled={savingProfile}>
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div>
                  <label className="text-sm text-gray-600">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-600">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">
                      Confirm Password
                    </label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={savePassword}
                    disabled={savingPassword}
                  >
                    {savingPassword ? 'Saving...' : 'Update Password'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Toaster />
    </div>
  );
}

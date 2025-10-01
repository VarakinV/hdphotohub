'use client';

import { useEffect, useState } from 'react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';

export default function BookingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeZone, setTimeZone] = useState('UTC');
  const [leadTimeHours, setLeadTimeHours] = useState(0);
  const [maxAdvanceDays, setMaxAdvanceDays] = useState(60);
  const [defaultBufferMin, setDefaultBufferMin] = useState(0);

  // Google Calendar integration state
  const [gLoading, setGLoading] = useState(false);
  const [gConnected, setGConnected] = useState(false);
  const [gCalendarId, setGCalendarId] = useState<string | null>(null);
  const [gCalendars, setGCalendars] = useState<
    { id: string; summary: string; primary?: boolean }[]
  >([]);

  const DEFAULT_TZ = [
    'UTC',
    'America/Edmonton',
    'America/Denver',
    'America/Toronto',
    'America/Vancouver',
  ];
  const [tzOptions, setTzOptions] = useState<string[]>(DEFAULT_TZ);
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && (Intl as any).supportedValuesOf) {
        const arr = (Intl as any).supportedValuesOf('timeZone') as string[];
        if (arr && arr.length) setTzOptions(arr);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/booking-settings');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load');
        setTimeZone(data.timeZone || 'UTC');
        setLeadTimeHours(Math.round(Number(data.leadTimeMin ?? 0) / 60));
        setMaxAdvanceDays(Number(data.maxAdvanceDays ?? 60));

        setDefaultBufferMin(Number(data.defaultBufferMin ?? 0));
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save() {
    try {
      setSaving(true);
      setError(null);
      const res = await fetch('/api/admin/booking-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timeZone,
          leadTimeMin: Math.round((Number(leadTimeHours) || 0) * 60),
          maxAdvanceDays,
          defaultBufferMin,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save');
      toast.success('Booking settings saved');
    } catch (e: any) {
      setError(e.message || 'Failed to save');
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  // Google integration hooks and actions
  useEffect(() => {
    (async () => {
      try {
        setGLoading(true);
        const res = await fetch(
          '/api/admin/integrations/google/calendar/status'
        );
        if (res.ok) {
          const data = await res.json();
          setGConnected(!!data.connected);
          setGCalendarId(data.calendarId || null);
          if (data.connected) await refreshCalendars();
        }
      } finally {
        setGLoading(false);
      }
    })();
  }, []);

  async function refreshCalendars() {
    try {
      setGLoading(true);
      const res = await fetch(
        '/api/admin/integrations/google/calendar/calendars'
      );
      if (!res.ok) return;
      const data = await res.json();
      setGCalendars(data.calendars || []);
    } finally {
      setGLoading(false);
    }
  }

  async function connectGoogle() {
    const callbackUrl = '/admin/booking-settings';
    await signIn('google', { callbackUrl });
  }

  async function disconnectGoogle() {
    try {
      setGLoading(true);
      await fetch('/api/admin/integrations/google/calendar/disconnect', {
        method: 'POST',
      });
      setGConnected(false);
      setGCalendars([]);
      setGCalendarId(null);
      toast.success('Disconnected Google Calendar');
    } finally {
      setGLoading(false);
    }
  }

  async function saveCalendarSelection() {
    try {
      setGLoading(true);
      const res = await fetch(
        '/api/admin/integrations/google/calendar/select',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ calendarId: gCalendarId }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save calendar');
      toast.success('Calendar selection saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save calendar');
    } finally {
      setGLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Booking Settings
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Configure booking preferences and scheduling constraints.
              </p>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Card className="p-4 grid gap-4">
          <div>
            <Label>Time Zone</Label>
            <select
              className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm"
              value={timeZone}
              onChange={(e) => setTimeZone(e.target.value)}
              disabled={loading}
            >
              {tzOptions.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label>Lead Time (hours)</Label>
              <Input
                className="mt-1"
                type="number"
                value={leadTimeHours}
                onChange={(e) => setLeadTimeHours(Number(e.target.value || 0))}
                disabled={loading}
              />
            </div>
            <div>
              <Label>Max Advance (days)</Label>
              <Input
                className="mt-1"
                type="number"
                value={maxAdvanceDays}
                onChange={(e) => setMaxAdvanceDays(Number(e.target.value || 0))}
                disabled={loading}
              />
            </div>
            <div>
              <Label>Default Buffer (minutes)</Label>
              <Input
                className="mt-1"
                type="number"
                value={defaultBufferMin}
                onChange={(e) =>
                  setDefaultBufferMin(Number(e.target.value || 0))
                }
                disabled={loading}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={save} disabled={saving || loading}>
              {saving ? 'Saving…' : 'Save Settings'}
            </Button>
          </div>
        </Card>

        <Card className="p-4 grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Google Calendar</h2>
              <p className="text-sm text-gray-600">
                Connect your Google Calendar to avoid conflicts and auto-create
                events.
              </p>
            </div>
            {!gConnected ? (
              <Button onClick={connectGoogle} disabled={gLoading}>
                Connect Google
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={refreshCalendars}
                  disabled={gLoading}
                >
                  Refresh
                </Button>
                <Button
                  variant="destructive"
                  onClick={disconnectGoogle}
                  disabled={gLoading}
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>

          {gConnected && (
            <div className="grid gap-2">
              <Label>Select calendar</Label>
              <select
                className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm"
                value={gCalendarId || ''}
                onChange={(e) => setGCalendarId(e.target.value || null)}
                disabled={gLoading}
              >
                <option value="">Primary (default)</option>
                {gCalendars.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.summary}
                    {c.primary ? ' (primary)' : ''}
                  </option>
                ))}
              </select>
              <div className="flex justify-end">
                <Button onClick={saveCalendarSelection} disabled={gLoading}>
                  Save Calendar
                </Button>
              </div>
            </div>
          )}
        </Card>
      </AdminTwoColumnShell>

      <Toaster />
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

function toMinutes(hhmm: string) {
  const [h, m] = (hhmm || '0:0').split(':').map((x) => parseInt(x || '0', 10));
  return (h || 0) * 60 + (m || 0);
}

function fromMinutes(min: number) {
  const h = Math.floor(min / 60)
    .toString()
    .padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AvailabilityPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    dayOfWeek: 1,
    start: '09:00',
    end: '17:00',
    timeZone: 'UTC',
    active: true,
  });

  const [rules, setRules] = useState<any[]>([]);

  const [form, setForm] = useState({
    dayOfWeek: 1,
    start: '09:00',
    end: '17:00',
    timeZone: 'UTC',
    active: true,
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [r1, r2] = await Promise.all([
          fetch('/api/admin/availability').then((r) => r.json()),
          fetch('/api/admin/booking-settings').then((r) => r.json()),
        ]);
        if (r1.error) throw new Error(r1.error);
        setRules(r1.rules || []);
        setForm((f) => ({ ...f, timeZone: r2.timeZone || 'UTC' }));
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function createRule() {
    try {
      setError(null);
      const body = {
        dayOfWeek: form.dayOfWeek,
        startMinutes: toMinutes(form.start),
        endMinutes: toMinutes(form.end),
        timeZone: form.timeZone,
        active: form.active,
      };
      const res = await fetch('/api/admin/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create');
      setRules((r) => [...r, data].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
      toast.success('Availability rule created');
      setCreateOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create availability rule');
      setError(e.message || 'Failed to create');
    }
  }

  async function updateRule(id: string, patch: any) {
    const res = await fetch(`/api/admin/availability/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) {
      setRules((rs) => rs.map((r) => (r.id === id ? data : r)));
      toast.success('Availability rule updated');
    } else {
      toast.error(data?.error || 'Failed to update availability rule');
    }
  }

  async function deleteRule(id: string) {
    const res = await fetch(`/api/admin/availability/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setRules((rs) => rs.filter((r) => r.id !== id));
      toast.success('Availability rule deleted');
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || 'Failed to delete availability rule');
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Availability</h1>
              <p className="text-sm text-gray-600 mt-1">
                Define your working days and time windows.
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Rule
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* Create Rule Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Availability Rule</DialogTitle>
              <DialogDescription>
                Specify day, time range, timezone and status.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid sm:grid-cols-5 gap-3 items-end">
                <div>
                  <Label>Day</Label>
                  <select
                    className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm"
                    value={form.dayOfWeek}
                    onChange={(e) =>
                      setForm({ ...form, dayOfWeek: Number(e.target.value) })
                    }
                  >
                    {DAYS.map((d, i) => (
                      <option key={i} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Start</Label>
                  <Input
                    className="mt-1"
                    value={form.start}
                    onChange={(e) =>
                      setForm({ ...form, start: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>End</Label>
                  <Input
                    className="mt-1"
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Time Zone</Label>
                  <Input
                    className="mt-1"
                    value={form.timeZone}
                    onChange={(e) =>
                      setForm({ ...form, timeZone: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="mt-6 inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.active}
                      onChange={(e) =>
                        setForm({ ...form, active: e.target.checked })
                      }
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    await createRule();
                    setCreateOpen(false);
                  }}
                  disabled={loading}
                >
                  Create Rule
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Rule Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Availability Rule</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid sm:grid-cols-5 gap-3 items-end">
                <div>
                  <Label>Day</Label>
                  <select
                    className="mt-1 w-full border border-input rounded-md px-3 py-2 text-sm"
                    value={editForm.dayOfWeek}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        dayOfWeek: Number(e.target.value),
                      })
                    }
                  >
                    {DAYS.map((d, i) => (
                      <option key={i} value={i}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Start</Label>
                  <Input
                    className="mt-1"
                    value={editForm.start}
                    onChange={(e) =>
                      setEditForm({ ...editForm, start: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>End</Label>
                  <Input
                    className="mt-1"
                    value={editForm.end}
                    onChange={(e) =>
                      setEditForm({ ...editForm, end: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Time Zone</Label>
                  <Input
                    className="mt-1"
                    value={editForm.timeZone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, timeZone: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="mt-6 inline-flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={editForm.active}
                      onChange={(e) =>
                        setEditForm({ ...editForm, active: e.target.checked })
                      }
                    />
                    Active
                  </label>
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={async () => {
                    if (!editId) return;
                    await updateRule(editId, {
                      dayOfWeek: editForm.dayOfWeek,
                      startMinutes: toMinutes(editForm.start),
                      endMinutes: toMinutes(editForm.end),
                      timeZone: editForm.timeZone,
                      active: editForm.active,
                    });
                    setEditOpen(false);
                  }}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* List */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Existing Rules</div>
          {rules.length === 0 ? (
            <div className="text-sm text-muted-foreground">No rules yet.</div>
          ) : (
            <div className="space-y-3">
              {rules.map((r) => (
                <div
                  key={r.id}
                  className="grid sm:grid-cols-6 gap-2 items-center border rounded-md p-2"
                >
                  <div className="text-sm">{DAYS[r.dayOfWeek]}</div>
                  <div className="text-sm">
                    {fromMinutes(r.startMinutes)} - {fromMinutes(r.endMinutes)}
                  </div>
                  <div className="text-sm">{r.timeZone}</div>
                  <div className="text-sm">
                    {r.active ? 'Active' : 'Inactive'}
                  </div>
                  <div className="flex justify-end sm:col-span-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditId(r.id);
                        setEditForm({
                          dayOfWeek: r.dayOfWeek,
                          start: fromMinutes(r.startMinutes),
                          end: fromMinutes(r.endMinutes),
                          timeZone: r.timeZone,
                          active: r.active,
                        });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteRule(r.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </AdminTwoColumnShell>
      <Toaster />
    </div>
  );
}

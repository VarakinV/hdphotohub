'use client';

import { useEffect, useState } from 'react';
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

export default function BlackoutsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ start: '', end: '', reason: '' });

  const [items, setItems] = useState<any[]>([]);
  const [form, setForm] = useState({ start: '', end: '', reason: '' });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/admin/blackouts');
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed to load');
        setItems(data.items || []);
      } catch (e: any) {
        setError(e.message || 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function createItem() {
    try {
      const body = {
        start: new Date(form.start).toISOString(),
        end: new Date(form.end).toISOString(),
        reason: form.reason || null,
      };
      const res = await fetch('/api/admin/blackouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create');
      setItems((prev) => [...prev, data]);
      toast.success('Blackout created');
      setCreateOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create blackout');
      setError(e.message || 'Failed to create');
    }
  }

  async function updateItem(id: string, patch: any) {
    const res = await fetch(`/api/admin/blackouts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (res.ok) {
      setItems((arr) => arr.map((x) => (x.id === id ? data : x)));
      toast.success('Blackout updated');
    } else {
      toast.error(data?.error || 'Failed to update blackout');
    }
  }

  async function deleteItem(id: string) {
    const res = await fetch(`/api/admin/blackouts/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setItems((arr) => arr.filter((x) => x.id !== id));
      toast.success('Blackout deleted');
    } else {
      const data = await res.json().catch(() => null);
      toast.error(data?.error || 'Failed to delete blackout');
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Blackouts</h1>
              <p className="text-sm text-gray-600 mt-1">
                Block out dates or times when bookings are not allowed.
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Blackout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Blackout</DialogTitle>
              <DialogDescription>
                Choose start/end and optionally provide a reason.
              </DialogDescription>
            </DialogHeader>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Start</Label>
                <Input
                  className="mt-1"
                  type="datetime-local"
                  value={form.start}
                  onChange={(e) => setForm({ ...form, start: e.target.value })}
                />
              </div>
              <div>
                <Label>End</Label>
                <Input
                  className="mt-1"
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => setForm({ ...form, end: e.target.value })}
                />
              </div>
              <div>
                <Label>Reason (optional)</Label>
                <Input
                  className="mt-1"
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={async () => {
                  await createItem();
                  setCreateOpen(false);
                }}
                disabled={loading}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Blackout</DialogTitle>
            </DialogHeader>
            <div className="grid sm:grid-cols-3 gap-3">
              <div>
                <Label>Start</Label>
                <Input
                  className="mt-1"
                  type="datetime-local"
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
                  type="datetime-local"
                  value={editForm.end}
                  onChange={(e) =>
                    setEditForm({ ...editForm, end: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Reason (optional)</Label>
                <Input
                  className="mt-1"
                  value={editForm.reason}
                  onChange={(e) =>
                    setEditForm({ ...editForm, reason: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={async () => {
                  if (!editId) return;
                  await updateItem(editId, {
                    start: new Date(editForm.start).toISOString(),
                    end: new Date(editForm.end).toISOString(),
                    reason: editForm.reason || null,
                  });
                  setEditOpen(false);
                }}
              >
                Save
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* List */}
        <Card className="p-4">
          <div className="text-sm font-medium mb-2">Existing Blackouts</div>
          {items.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No blackouts yet.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((b) => (
                <div
                  key={b.id}
                  className="grid sm:grid-cols-5 gap-2 items-center border rounded-md p-2"
                >
                  <div className="text-sm">
                    {new Date(b.start).toLocaleString()} —{' '}
                    {new Date(b.end).toLocaleString()}
                  </div>
                  <div className="text-sm sm:col-span-2">{b.reason || ''}</div>
                  <div className="flex justify-end sm:col-span-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditId(b.id);
                        setEditForm({
                          start: b.start?.slice(0, 16) || '',
                          end: b.end?.slice(0, 16) || '',
                          reason: b.reason || '',
                        });
                        setEditOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteItem(b.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Toaster />
      </AdminTwoColumnShell>
    </div>
  );
}

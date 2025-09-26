'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Pencil, Trash2, Save, X, Plus } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Tax {
  id: string;
  name: string;
  rateBps: number;
  active: boolean;
}

export default function TaxesPage() {
  const [items, setItems] = useState<Tax[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ active?: string; query?: string }>(
    {}
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ name?: string; ratePercent?: string }>(
    {}
  );

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [create, setCreate] = useState<{ name: string; ratePercent: string }>({
    name: '',
    ratePercent: '',
  });
  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Tax | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [createErr, setCreateErr] = useState<{
    name?: string;
    ratePercent?: string;
    form?: string;
  }>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/taxes');
        const data = await res.json();
        setItems(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((t) => {
      if (filters.active === 'ACTIVE' && !t.active) return false;
      if (filters.active === 'INACTIVE' && t.active) return false;
      if (
        filters.query &&
        !t.name.toLowerCase().includes((filters.query || '').toLowerCase())
      )
        return false;
      return true;
    });
  }, [items, filters]);

  const [page, setPage] = useState(1);
  const perPage = 20;
  useEffect(() => {
    setPage(1);
  }, [filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page]
  );

  function startEdit(row: Tax) {
    setEditingId(row.id);
    setDraft({ name: row.name, ratePercent: (row.rateBps / 100).toFixed(2) });
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  async function saveEdit(id: string) {
    const rateBps = Math.round(Number(draft.ratePercent || '0') * 100);
    const res = await fetch(`/api/taxes/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: draft.name, rateBps }),
    });
    if (res.ok) {
      const u = await res.json();
      setItems((list) => list.map((x) => (x.id === id ? u : x)));
      cancelEdit();
    } else alert('Failed to save');
  }

  async function toggleActive(row: Tax) {
    const res = await fetch(`/api/taxes/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    });
    if (res.ok) {
      const u = await res.json();
      setItems((list) => list.map((x) => (x.id === row.id ? u : x)));
    }
  }

  async function remove(row: Tax) {
    try {
      const res = await fetch(`/api/taxes/${row.id}`, { method: 'DELETE' });
      if (res.ok) {
        setItems((list) => list.filter((x) => x.id !== row.id));
        toast.success('Tax deleted');
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          const msg = data?.error || 'Cannot delete tax applied to services';
          const details = Array.isArray(data?.details)
            ? ` ${data.details.join(' ')}`
            : '';
          toast.error(`${msg}.${details}`.trim());
        } else {
          toast.error(data?.error || 'Failed to delete tax');
        }
      }
    } catch (e) {
      toast.error('Network error while deleting tax');
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Taxes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage taxes and rates
              </p>
            </div>
            <div>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Tax
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {/* Create New Tax Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tax</DialogTitle>
              <DialogDescription>
                Provide tax name and rate (percent).
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={create.name}
                  onChange={(e) =>
                    setCreate((c) => ({ ...c, name: e.target.value }))
                  }
                />
                {createErr.name && (
                  <p className="text-xs text-red-600 mt-1">{createErr.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Rate (%)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={create.ratePercent}
                  onChange={(e) =>
                    setCreate((c) => ({ ...c, ratePercent: e.target.value }))
                  }
                />
                {createErr.ratePercent && (
                  <p className="text-xs text-red-600 mt-1">
                    {createErr.ratePercent}
                  </p>
                )}
              </div>
              {createErr.form && (
                <p className="text-xs text-red-600">{createErr.form}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const errs: any = {};
                    if (!create.name.trim()) errs.name = 'Name is required';
                    const rate = Number(create.ratePercent);
                    if (Number.isNaN(rate) || rate < 0 || rate > 100)
                      errs.ratePercent = 'Enter 0–100';
                    setCreateErr(errs);
                    if (Object.keys(errs).length) return;
                    try {
                      const res = await fetch('/api/taxes', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: create.name.trim(),
                          rateBps: Math.round(rate * 100),
                        }),
                      });
                      if (!res.ok) {
                        let msg = 'Failed to create tax';
                        try {
                          const data = await res.json();
                          if (data?.error) msg = data.error;
                        } catch {}
                        setCreateErr((e: any) => ({ ...e, form: msg }));
                        return;
                      }
                      const created = await res.json();
                      setItems((list) => [created, ...list]);
                      setCreateOpen(false);
                      setCreate({ name: '', ratePercent: '' });
                      setCreateErr({});
                    } catch {
                      setCreateErr((e: any) => ({
                        ...e,
                        form: 'Network error',
                      }));
                    }
                  }}
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Active:</span>
            <select
              className="h-10 rounded-md border px-3"
              defaultValue="ALL"
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  active: e.target.value === 'ALL' ? undefined : e.target.value,
                }))
              }
            >
              <option value="ALL">All</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <div className="ml-auto w-full sm:w-64">
            <Input
              placeholder="Search name..."
              onChange={(e) =>
                setFilters((f) => ({ ...f, query: e.target.value }))
              }
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((t) => {
                    const isEditing = editingId === t.id;
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input
                              value={draft.name || ''}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  name: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            t.name
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={draft.ratePercent || ''}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  ratePercent: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            `${(t.rateBps / 100).toFixed(2)}%`
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              size="sm"
                              checked={t.active}
                              onCheckedChange={() => toggleActive(t)}
                              srLabel="Toggle active"
                            />
                            <span className="text-base">
                              {t.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={cancelEdit}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(t.id)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(t)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setDeleteTarget(t);
                                    setDeleteOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="p-4 border-t flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Page {page} of {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </AdminTwoColumnShell>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this tax?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!deleteTarget) return;
                setDeleteLoading(true);
                await remove(deleteTarget);
                setDeleteLoading(false);
                setDeleteOpen(false);
                setDeleteTarget(null);
              }}
              disabled={deleteLoading}
            >
              {deleteLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Toaster />
    </div>
  );
}

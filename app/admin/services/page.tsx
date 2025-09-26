'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { GripVertical } from 'lucide-react';
import { Loader2, Pencil, Trash2, Save, X, Plus } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}
interface Tax {
  id: string;
  name: string;
  rateBps: number;
}
interface ServiceRow {
  id: string;
  name: string;
  description?: string | null;
  categoryId: string;
  category?: { id: string; name: string };
  priceCents: number;
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  minSqFt?: number | null;
  maxSqFt?: number | null;
  active: boolean;
  taxes?: Tax[];
}

export default function ServicesPage() {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);

  const [filters, setFilters] = useState<{
    categoryId?: string;
    active?: string;
    query?: string;
  }>({});

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<
    Partial<ServiceRow> & {
      priceDollars?: string;
      taxIds?: string[];
      description?: string | null;
      bufferBeforeMin?: number;
      bufferAfterMin?: number;
    }
  >({});
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ServiceRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Drag & drop ordering (UI only; persistence pending migration)
  const [dragId, setDragId] = useState<string | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);

  function reorderByIds(list: ServiceRow[], fromId: string, toId: string) {
    const srcIdx = list.findIndex((x) => x.id === fromId);
    const dstIdx = list.findIndex((x) => x.id === toId);
    if (srcIdx === -1 || dstIdx === -1) return list;
    const copy = [...list];
    const [moved] = copy.splice(srcIdx, 1);
    copy.splice(dstIdx, 0, moved);
    return copy;
  }

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (overId: string) => {
    if (!dragId || dragId === overId) return;
    setServices((prev) => reorderByIds(prev, dragId!, overId));
    setOrderDirty(true);
    setDragId(null);
  };

  const saveOrder = async () => {
    try {
      const ids = services.map((s) => s.id);
      const res = await fetch('/api/services/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Failed to save order');
      setOrderDirty(false);
    } catch (e) {
      alert('Failed to save order');
    }
  };

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [create, setCreate] = useState<{
    name: string;
    description?: string;
    categoryId: string;
    priceDollars: string;
    durationMin: string;
    bufferBeforeMin?: string;
    bufferAfterMin?: string;
    minSqFt?: string;
    maxSqFt?: string;
    taxIds: string[];
  }>({
    name: '',
    description: '',
    categoryId: '',
    priceDollars: '',
    durationMin: '60',
    bufferBeforeMin: '0',
    bufferAfterMin: '0',
    minSqFt: '',
    maxSqFt: '',
    taxIds: [],
  });
  const [createErrors, setCreateErrors] = useState<{
    name?: string;
    categoryId?: string;
    priceDollars?: string;
    durationMin?: string;
    form?: string;
  }>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [svcRes, catRes, taxRes] = await Promise.all([
          fetch('/api/services'),
          fetch('/api/service-categories'),
          fetch('/api/taxes'),
        ]);
        const [svc, cats, txs] = await Promise.all([
          svcRes.json(),
          catRes.json(),
          taxRes.json(),
        ]);
        setServices(svc);
        setCategories(cats);
        setTaxes(txs);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (filters.categoryId && s.categoryId !== filters.categoryId)
        return false;
      if (filters.active === 'ACTIVE' && !s.active) return false;
      if (filters.active === 'INACTIVE' && s.active) return false;
      if (
        filters.query &&
        !s.name.toLowerCase().includes(filters.query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [services, filters]);

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

  function startEdit(row: ServiceRow) {
    setEditingId(null);
    setEditId(row.id);
    setDraft({
      id: row.id,
      name: row.name,
      description: row.description ?? '',
      categoryId: row.categoryId,
      priceDollars: (row.priceCents / 100).toFixed(2),
      durationMin: row.durationMin,
      bufferBeforeMin: row.bufferBeforeMin,
      bufferAfterMin: row.bufferAfterMin,
      minSqFt: row.minSqFt ?? undefined,
      maxSqFt: row.maxSqFt ?? undefined,
      taxIds: row.taxes?.map((t) => t.id) ?? [],
    });
    setEditOpen(true);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditOpen(false);
    setEditId(null);
    setDraft({});
  }

  async function saveEdit(id: string) {
    const priceCents = Math.round(Number(draft.priceDollars || '0') * 100);
    const res = await fetch(`/api/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: draft.name,
        description: draft.description ?? null,
        categoryId: draft.categoryId,
        priceCents,
        durationMin: draft.durationMin,
        bufferBeforeMin: draft.bufferBeforeMin ?? 0,
        bufferAfterMin: draft.bufferAfterMin ?? 0,
        minSqFt: draft.minSqFt ?? null,
        maxSqFt: draft.maxSqFt ?? null,
        taxIds: draft.taxIds,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setServices((list) => list.map((s) => (s.id === id ? updated : s)));
      cancelEdit();
    } else {
      alert('Failed to save');
    }
  }

  async function toggleActive(row: ServiceRow) {
    const res = await fetch(`/api/services/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setServices((list) => list.map((s) => (s.id === row.id ? updated : s)));
    }
  }

  async function remove(row: ServiceRow) {
    try {
      const res = await fetch(`/api/services/${row.id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices((list) => list.filter((s) => s.id !== row.id));
        toast.success('Service deleted');
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Failed to delete service');
      }
    } catch (e) {
      toast.error('Network error while deleting service');
    }
  }

  return (
    <div className="min-h-screen">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Services</h1>
              <p className="text-sm text-gray-600 mt-1">Manage your services</p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Service
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {/* Create New Service Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Service</DialogTitle>
              <DialogDescription>
                Set up a service with price in dollars and duration in minutes.
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
                {createErrors.name && (
                  <p className="text-xs text-red-600 mt-1">
                    {createErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full h-10 rounded-md border px-3"
                  value={create.categoryId}
                  onChange={(e) =>
                    setCreate((c) => ({ ...c, categoryId: e.target.value }))
                  }
                >
                  <option value="">Select a category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {createErrors.categoryId && (
                  <p className="text-xs text-red-600 mt-1">
                    {createErrors.categoryId}
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="mt-1 w-full min-h-[80px] rounded-md border px-3 py-2 text-sm"
                  value={create.description || ''}
                  onChange={(e) =>
                    setCreate((c) => ({ ...c, description: e.target.value }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">
                    Buffer before (min)
                  </label>
                  <Input
                    type="number"
                    value={create.bufferBeforeMin || '0'}
                    onChange={(e) =>
                      setCreate((c) => ({
                        ...c,
                        bufferBeforeMin: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Buffer after (min)
                  </label>
                  <Input
                    type="number"
                    value={create.bufferAfterMin || '0'}
                    onChange={(e) =>
                      setCreate((c) => ({
                        ...c,
                        bufferAfterMin: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Price ($)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={create.priceDollars}
                    onChange={(e) =>
                      setCreate((c) => ({ ...c, priceDollars: e.target.value }))
                    }
                  />
                  {createErrors.priceDollars && (
                    <p className="text-xs text-red-600 mt-1">
                      {createErrors.priceDollars}
                    </p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (min)</label>
                  <Input
                    type="number"
                    value={create.durationMin}
                    onChange={(e) =>
                      setCreate((c) => ({ ...c, durationMin: e.target.value }))
                    }
                  />
                  {createErrors.durationMin && (
                    <p className="text-xs text-red-600 mt-1">
                      {createErrors.durationMin}
                    </p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">
                    Min sqft (optional)
                  </label>
                  <Input
                    type="number"
                    value={create.minSqFt || ''}
                    onChange={(e) =>
                      setCreate((c) => ({ ...c, minSqFt: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Max sqft (optional)
                  </label>
                  <Input
                    type="number"
                    value={create.maxSqFt || ''}
                    onChange={(e) =>
                      setCreate((c) => ({ ...c, maxSqFt: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Taxes</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {taxes.map((t) => {
                    const checked = create.taxIds.includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className="inline-flex items-center gap-2 text-xs border rounded px-2 py-1 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={checked}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setCreate((c) => {
                              const ids = new Set(c.taxIds);
                              if (on) ids.add(t.id);
                              else ids.delete(t.id);
                              return { ...c, taxIds: Array.from(ids) };
                            });
                          }}
                        />
                        {t.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              {createErrors.form && (
                <p className="text-xs text-red-600">{createErrors.form}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    const errs: any = {};
                    if (!create.name.trim()) errs.name = 'Name is required';
                    if (!create.categoryId)
                      errs.categoryId = 'Category is required';
                    const price = Number(create.priceDollars);
                    if (Number.isNaN(price) || price < 0)
                      errs.priceDollars = 'Enter a valid non-negative price';
                    const dur = Number(create.durationMin);
                    if (!Number.isInteger(dur) || dur <= 0)
                      errs.durationMin = 'Enter a positive integer';
                    setCreateErrors(errs);
                    if (Object.keys(errs).length) return;

                    try {
                      const res = await fetch('/api/services', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: create.name.trim(),
                          description: create.description || undefined,
                          categoryId: create.categoryId,
                          priceCents: Math.round(price * 100),
                          durationMin: dur,
                          bufferBeforeMin: create.bufferBeforeMin
                            ? Number(create.bufferBeforeMin)
                            : 0,
                          bufferAfterMin: create.bufferAfterMin
                            ? Number(create.bufferAfterMin)
                            : 0,
                          minSqFt: create.minSqFt
                            ? Number(create.minSqFt)
                            : null,
                          maxSqFt: create.maxSqFt
                            ? Number(create.maxSqFt)
                            : null,
                          taxIds: create.taxIds,
                        }),
                      });
                      if (!res.ok) {
                        let msg = 'Failed to create service';
                        try {
                          const data = await res.json();
                          if (data?.error) msg = data.error;
                        } catch {}
                        setCreateErrors((e: any) => ({ ...e, form: msg }));
                        return;
                      }
                      const created = await res.json();
                      setServices((list) => [created, ...list]);
                      setCreateOpen(false);
                      setCreate({
                        name: '',
                        description: '',
                        categoryId: '',
                        priceDollars: '',
                        durationMin: '60',
                        bufferBeforeMin: '0',
                        bufferAfterMin: '0',
                        minSqFt: '',
                        maxSqFt: '',
                        taxIds: [],
                      });
                      setCreateErrors({});
                    } catch (e) {
                      setCreateErrors((er: any) => ({
                        ...er,
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
        {/* Edit Service Dialog */}
        <Dialog
          open={editOpen}
          onOpenChange={(o) => (o ? setEditOpen(true) : cancelEdit())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Service</DialogTitle>
              <DialogDescription>
                Update details for this service.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={draft.name || ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="mt-1 w-full min-h-[80px] rounded-md border px-3 py-2 text-sm"
                  value={draft.description ?? ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium">Category</label>
                <select
                  className="w-full h-10 rounded-md border px-3"
                  value={draft.categoryId || ''}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, categoryId: e.target.value }))
                  }
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Price (USD)</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={draft.priceDollars || ''}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, priceDollars: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Duration (min)</label>
                  <Input
                    type="number"
                    value={String(draft.durationMin ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        durationMin: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">
                    Buffer Before (min)
                  </label>
                  <Input
                    type="number"
                    value={String(draft.bufferBeforeMin ?? 0)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        bufferBeforeMin: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">
                    Buffer After (min)
                  </label>
                  <Input
                    type="number"
                    value={String(draft.bufferAfterMin ?? 0)}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        bufferAfterMin: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Min Sq Ft</label>
                  <Input
                    type="number"
                    value={String(draft.minSqFt ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        minSqFt: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Max Sq Ft</label>
                  <Input
                    type="number"
                    value={String(draft.maxSqFt ?? '')}
                    onChange={(e) =>
                      setDraft((d) => ({
                        ...d,
                        maxSqFt: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Taxes</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {taxes.map((t) => {
                    const checked = (draft.taxIds || []).includes(t.id);
                    return (
                      <label
                        key={t.id}
                        className="inline-flex items-center gap-2 text-xs border rounded px-2 py-1 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          className="cursor-pointer"
                          checked={checked}
                          onChange={(e) => {
                            const on = e.target.checked;
                            setDraft((d) => {
                              const ids = new Set(d.taxIds || []);
                              if (on) ids.add(t.id);
                              else ids.delete(t.id);
                              return { ...d, taxIds: Array.from(ids) };
                            });
                          }}
                        />
                        {t.name}
                      </label>
                    );
                  })}
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => cancelEdit()}>
                  Cancel
                </Button>
                <Button onClick={() => editId && saveEdit(editId)}>Save</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Category:</span>
            <Select
              defaultValue="ALL"
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  categoryId: v === 'ALL' ? undefined : v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Active:</span>
            <Select
              defaultValue="ALL"
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  active: v === 'ALL' ? undefined : v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
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

        {orderDirty && (
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={saveOrder}>
              Save order
            </Button>
          </div>
        )}

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
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Taxes</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((s) => {
                    const isEditing = editingId === s.id;
                    return (
                      <TableRow
                        key={s.id}
                        draggable
                        onDragStart={() => handleDragStart(s.id)}
                        onDragOver={handleDragOver}
                        onDrop={() => handleDrop(s.id)}
                      >
                        <TableCell className="w-8 align-middle text-gray-400">
                          <GripVertical className="h-4 w-4" />
                        </TableCell>
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
                            s.name
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <select
                              className="w-full h-10 rounded-md border px-3"
                              value={draft.categoryId || ''}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  categoryId: e.target.value,
                                }))
                              }
                            >
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          ) : (
                            s.category?.name || '—'
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={draft.priceDollars || ''}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  priceDollars: e.target.value,
                                }))
                              }
                            />
                          ) : (
                            `$${(s.priceCents / 100).toFixed(2)}`
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Input
                              type="number"
                              value={String(draft.durationMin ?? '')}
                              onChange={(e) =>
                                setDraft((d) => ({
                                  ...d,
                                  durationMin: Number(e.target.value),
                                }))
                              }
                            />
                          ) : (
                            `${s.durationMin} min`
                          )}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <div className="flex flex-wrap gap-2">
                              {taxes.map((t) => {
                                const checked = (draft.taxIds || []).includes(
                                  t.id
                                );
                                return (
                                  <label
                                    key={t.id}
                                    className="inline-flex items-center gap-2 text-xs border rounded px-2 py-1 cursor-pointer"
                                  >
                                    <input
                                      type="checkbox"
                                      className="cursor-pointer"
                                      checked={checked}
                                      onChange={(e) => {
                                        const on = e.target.checked;
                                        setDraft((d) => {
                                          const ids = new Set(d.taxIds || []);
                                          if (on) ids.add(t.id);
                                          else ids.delete(t.id);
                                          return {
                                            ...d,
                                            taxIds: Array.from(ids),
                                          };
                                        });
                                      }}
                                    />
                                    {t.name}
                                  </label>
                                );
                              })}
                            </div>
                          ) : (
                            s.taxes?.map((t) => t.name).join(', ') || '—'
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              size="sm"
                              checked={s.active}
                              onCheckedChange={() => toggleActive(s)}
                              srLabel="Toggle active"
                            />
                            <span className="text-base">
                              {s.active ? 'Active' : 'Inactive'}
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
                                  onClick={() => cancelEdit()}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={() => saveEdit(s.id)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(s)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setDeleteTarget(s);
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

              {/* Pagination */}
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
            <AlertDialogTitle>Delete this service?</AlertDialogTitle>
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

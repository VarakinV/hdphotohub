'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
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
  Loader2,
  Pencil,
  Trash2,
  Save,
  X,
  Plus,
  Camera,
  Home,
  Building2,
  Layers as LayersIcon,
  Image as ImageIcon,
  Video as VideoIcon,
  Wand2,
  Ruler,
  CalendarClock,
  MapPin,
  Drone,
  Sofa,
  Film,
  Clapperboard,
  FileVideo,
  Smartphone,
  Moon,
  Rocket,
  Megaphone,
  GripVertical,
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  description?: string | null;
  iconKey?: string | null;
  featured: boolean;
  active: boolean;
}

export default function ServiceCategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  // Drag & drop ordering
  const [dragId, setDragId] = useState<string | null>(null);
  const [orderDirty, setOrderDirty] = useState(false);
  const [filters, setFilters] = useState<{ active?: string; query?: string }>(
    {}
  );
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState('');

  // Create dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDesc, setCreateDesc] = useState('');
  const [createIconKey, setCreateIconKey] = useState<string>('');
  const [createErr, setCreateErr] = useState<{ name?: string; form?: string }>(
    {}
  );
  const [createFeatured, setCreateFeatured] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editIconKey, setEditIconKey] = useState<string>('');

  const [editFeatured, setEditFeatured] = useState(false);

  // Delete confirmation state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const ICON_OPTIONS = [
    { key: 'Camera', label: 'Camera', Icon: Camera },
    { key: 'Home', label: 'Home', Icon: Home },
    { key: 'Building2', label: 'Building', Icon: Building2 },
    { key: 'Layers', label: 'Layers', Icon: LayersIcon },
    { key: 'Image', label: 'Image', Icon: ImageIcon },
    { key: 'Video', label: 'Video', Icon: VideoIcon },
    { key: 'Wand2', label: 'Wand', Icon: Wand2 },
    { key: 'Ruler', label: 'Ruler', Icon: Ruler },
    { key: 'CalendarClock', label: 'Calendar', Icon: CalendarClock },
    { key: 'MapPin', label: 'Map Pin', Icon: MapPin },

    { key: 'Drone', label: 'Drone', Icon: Drone },
    { key: 'Sofa', label: 'Sofa', Icon: Sofa },
    { key: 'Film', label: 'Film', Icon: Film },
    { key: 'Clapperboard', label: 'Clapperboard', Icon: Clapperboard },
    { key: 'FileVideo', label: 'File Video', Icon: FileVideo },
    { key: 'Smartphone', label: 'Smartphone', Icon: Smartphone },
    { key: 'Moon', label: 'Moon', Icon: Moon },
    { key: 'Rocket', label: 'Rocket', Icon: Rocket },
    { key: 'Megaphone', label: 'Megaphone', Icon: Megaphone },
  ];

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/service-categories');
        const data = await res.json();
        setItems(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return items.filter((c) => {
      if (filters.active === 'ACTIVE' && !c.active) return false;
      if (filters.active === 'INACTIVE' && c.active) return false;
      if (
        filters.query &&
        !c.name.toLowerCase().includes((filters.query || '').toLowerCase())
      )
        return false;
      return true;
    });
  }, [items, filters]);

  function reorderByIds(list: Category[], fromId: string, toId: string) {
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
    setItems((prev) => reorderByIds(prev, dragId!, overId));
    setOrderDirty(true);
    setDragId(null);
  };

  const saveOrder = async () => {
    try {
      const ids = items.map((c) => c.id);
      const res = await fetch('/api/service-categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error('Failed to save order');
      setOrderDirty(false);
      toast.success('Order saved');
    } catch (e) {
      toast.error('Failed to save order');
    }
  };

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

  function startEdit(row: Category) {
    setEditingId(null);
    setEditId(row.id);
    setEditName(row.name);
    setEditDesc(row.description ?? '');
    setEditIconKey(row.iconKey || '');
    setEditFeatured(!!row.featured);
    setEditOpen(true);
  }
  function cancelEdit() {
    setEditingId(null);
    setEditOpen(false);
    setEditId(null);
    setDraftName('');
  }

  async function saveEdit(id: string) {
    const res = await fetch(`/api/service-categories/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName,
        description: editDesc || null,
        iconKey: editIconKey || null,
        featured: editFeatured,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setItems((list) => list.map((x) => (x.id === id ? updated : x)));
      cancelEdit();
    } else {
      alert('Failed to save');
    }
  }

  async function toggleActive(row: Category) {
    const res = await fetch(`/api/service-categories/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    });
    if (res.ok) {
      const u = await res.json();
      setItems((list) => list.map((x) => (x.id === row.id ? u : x)));
    }
  }

  async function remove(row: Category) {
    try {
      const res = await fetch(`/api/service-categories/${row.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setItems((list) => list.filter((x) => x.id !== row.id));
        toast.success('Category deleted');
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          const msg = data?.error || 'Cannot delete category with services';
          const details = Array.isArray(data?.details)
            ? ` ${data.details.join(' ')}`
            : '';
          toast.error(`${msg}.${details}`.trim());
        } else {
          toast.error(data?.error || 'Failed to delete category');
        }
      }
    } catch (e) {
      toast.error('Network error while deleting category');
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
                Service Categories
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your service categories
              </p>
            </div>
            <div>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> New Category
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {/* Create New Category Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Category</DialogTitle>
              <DialogDescription>
                Add details for the category.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                />
                {createErr.name && (
                  <p className="text-xs text-red-600 mt-1">{createErr.name}</p>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="mt-1 w-full min-h-[80px] rounded-md border px-3 py-2 text-sm"
                  value={createDesc}
                  onChange={(e) => setCreateDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Icon</label>
                <div className="mt-1 flex items-center gap-3">
                  <Select onValueChange={(v) => setCreateIconKey(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(({ key, label, Icon }) => (
                        <SelectItem key={key} value={key}>
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(() => {
                    const sel = ICON_OPTIONS.find(
                      (i) => i.key === createIconKey
                    );
                    return sel ? (
                      <sel.Icon className="h-6 w-6 text-gray-600" />
                    ) : null;
                  })()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Featured</label>
                <div className="mt-1 flex items-center gap-2">
                  <Switch
                    checked={createFeatured}
                    onCheckedChange={setCreateFeatured}
                    srLabel="Toggle featured"
                  />
                  <span className="text-sm text-gray-600">
                    Show under Packages
                  </span>
                </div>
              </div>
            </div>
            {createErr.form && (
              <p className="text-xs text-red-600 mt-2">{createErr.form}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  const errs: any = {};
                  if (!createName.trim()) errs.name = 'Name is required';
                  setCreateErr(errs);
                  if (Object.keys(errs).length) return;
                  try {
                    const res = await fetch('/api/service-categories', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: createName.trim(),
                        description: createDesc || undefined,
                        iconKey: createIconKey || undefined,
                        featured: createFeatured,
                      }),
                    });
                    if (!res.ok) {
                      let msg = 'Failed to create category';
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
                    setCreateName('');
                    setCreateErr({});
                  } catch {
                    setCreateErr((e: any) => ({ ...e, form: 'Network error' }));
                  }
                }}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Category */}
        <Dialog
          open={editOpen}
          onOpenChange={(o) => (o ? setEditOpen(true) : cancelEdit())}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Category</DialogTitle>
              <DialogDescription>
                Update name, description and icon.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  className="mt-1 w-full min-h-[80px] rounded-md border px-3 py-2 text-sm"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Icon</label>
                <div className="mt-1 flex items-center gap-3">
                  <Select
                    value={editIconKey || ''}
                    onValueChange={(v) => setEditIconKey(v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                      {ICON_OPTIONS.map(({ key, label, Icon }) => (
                        <SelectItem key={key} value={key}>
                          <span className="inline-flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {(() => {
                    const sel = ICON_OPTIONS.find((i) => i.key === editIconKey);
                    return sel ? (
                      <sel.Icon className="h-6 w-6 text-gray-600" />
                    ) : null;
                  })()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Featured</label>
                <div className="mt-1 flex items-center gap-2">
                  <Switch
                    checked={editFeatured}
                    onCheckedChange={setEditFeatured}
                    srLabel="Toggle featured"
                  />
                  <span className="text-sm text-gray-600">
                    Show under Packages
                  </span>
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
              {orderDirty && (
                <div className="p-3 border-b flex justify-end">
                  <Button size="sm" onClick={saveOrder}>
                    Save order
                  </Button>
                </div>
              )}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((c) => {
                    const isEditing = editingId === c.id;
                    return (
                      <TableRow
                        key={c.id}
                        draggable
                        onDragStart={() => setDragId(c.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(c.id)}
                      >
                        <TableCell className="w-8 align-middle text-gray-400">
                          <GripVertical className="h-4 w-4" />
                        </TableCell>
                        <TableCell className="font-medium">
                          {isEditing ? (
                            <Input
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value)}
                            />
                          ) : (
                            c.name
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Switch
                              size="sm"
                              checked={c.active}
                              onCheckedChange={() => toggleActive(c)}
                              srLabel="Toggle active"
                            />
                            <span className="text-base">
                              {c.active ? 'Active' : 'Inactive'}
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
                                  onClick={() => saveEdit(c.id)}
                                >
                                  <Save className="h-4 w-4" />
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => startEdit(c)}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => {
                                    setDeleteTarget(c);
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
            <AlertDialogTitle>Delete this category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. If the category has services,
              deletion will be blocked. Delete or move services first.
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

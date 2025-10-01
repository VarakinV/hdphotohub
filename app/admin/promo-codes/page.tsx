'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

interface Service {
  id: string;
  name: string;
}
interface PromoRow {
  id: string;
  displayName: string;
  code: string;
  startDate: string | null;
  endDate: string | null;
  maxUsesPerRealtor?: number | null;
  maxUsesTotal?: number | null;
  discountType: 'AMOUNT' | 'PERCENT';
  discountRateBps?: number | null;
  discountValueCents?: number | null;
  active: boolean;
  serviceIds: string[];
}

function money(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PromoCodesPage() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<PromoRow[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PromoRow | null>(null);

  const [create, setCreate] = useState<any>({
    displayName: '',
    code: '',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: '',
    maxUsesPerRealtor: '',
    maxUsesTotal: '',
    discountType: 'AMOUNT',
    discountValueDollars: '0.00',
    discountPercent: '',
    active: true,
    serviceIds: [] as string[],
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});

  const [edit, setEdit] = useState<any>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [promoRes, svcRes] = await Promise.all([
          fetch('/api/promo-codes'),
          fetch('/api/services'),
        ]);
        const [promo, svc] = await Promise.all([
          promoRes.json(),
          svcRes.json(),
        ]);
        setRows(promo);
        setServices(svc.map((s: any) => ({ id: s.id, name: s.name })));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const startCreate = () => {
    setCreate({
      displayName: '',
      code: '',
      startDate: new Date().toISOString().slice(0, 10),
      endDate: '',
      maxUsesPerRealtor: '',
      maxUsesTotal: '',
      discountType: 'AMOUNT',
      discountValueDollars: '0.00',
      discountPercent: '',
      active: true,
      serviceIds: services.map((s) => s.id),
    });
    setCreateErrors({});
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    setCreateErrors({});
    const res = await fetch('/api/promo-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(create),
    });
    if (res.ok) {
      const row = await res.json();
      setRows((list) => [row, ...list]);
      setCreateOpen(false);
      toast.success('Promo code created');
    } else {
      const data = await res.json().catch(() => ({}));
      if (data?.details) setCreateErrors(data.details);
      toast.error(data?.error || 'Failed to create promo code');
    }
  };

  const startEdit = (row: PromoRow) => {
    setEditId(row.id);
    setEdit({
      displayName: row.displayName,
      code: row.code,
      startDate: row.startDate ? String(row.startDate).slice(0, 10) : '',
      endDate: row.endDate ? String(row.endDate).slice(0, 10) : '',
      maxUsesPerRealtor: row.maxUsesPerRealtor ?? '',
      maxUsesTotal: row.maxUsesTotal ?? '',
      discountType: row.discountType,
      discountValueDollars:
        row.discountValueCents != null
          ? (row.discountValueCents / 100).toFixed(2)
          : '',
      discountPercent:
        row.discountRateBps != null ? String(row.discountRateBps / 100) : '',
      active: row.active,
      serviceIds: row.serviceIds ?? [],
    });
    setEditErrors({});
    setEditOpen(true);
  };

  const submitEdit = async () => {
    if (!editId) return;
    setEditErrors({});
    const res = await fetch(`/api/promo-codes/${editId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edit),
    });
    if (res.ok) {
      const row = await res.json();
      setRows((list) => list.map((r) => (r.id === row.id ? row : r)));
      setEditOpen(false);
      toast.success('Saved changes');
    } else {
      const data = await res.json().catch(() => ({}));
      if (data?.details) setEditErrors(data.details);
      toast.error(data?.error || 'Failed to save');
    }
  };

  const remove = async (row: PromoRow) => {
    setDeleteTarget(row);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await fetch(`/api/promo-codes/${deleteTarget.id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setRows((list) => list.filter((r) => r.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);
      toast.success('Deleted');
    } else {
      toast.error('Failed to delete');
    }
  };

  const discountSummary = (r: PromoRow) => {
    if (r.discountType === 'AMOUNT') return money(r.discountValueCents || 0);
    return `${(r.discountRateBps || 0) / 100}%`;
  };

  const toggleActive = async (row: PromoRow) => {
    const res = await fetch(`/api/promo-codes/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !row.active }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((list) => list.map((r) => (r.id === row.id ? updated : r)));
    }
  };

  const selectAll = () =>
    setCreate((c: any) => ({ ...c, serviceIds: services.map((s) => s.id) }));
  const deselectAll = () => setCreate((c: any) => ({ ...c, serviceIds: [] }));

  return (
    <div className="min-h-screen">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Promo Codes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Create and manage discount codes
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={startCreate}>
                <Plus className="mr-2 h-4 w-4" /> New Promo Code
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        <Card className="p-0 overflow-hidden">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : rows.length === 0 ? (
            <div className="p-8 text-center text-gray-600">
              No promo codes yet.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Display Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead>Applies to</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {r.displayName}
                    </TableCell>
                    <TableCell>{r.code}</TableCell>
                    <TableCell>{discountSummary(r)}</TableCell>
                    <TableCell>
                      {r.startDate ? String(r.startDate).slice(0, 10) : 'today'}
                      {r.endDate
                        ? `											to ${String(r.endDate).slice(0, 10)}`
                        : '											no end'}
                    </TableCell>
                    <TableCell>{r.serviceIds?.length || 0} services</TableCell>
                    <TableCell>
                      <Switch
                        checked={r.active}
                        onCheckedChange={() => toggleActive(r)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(r)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => remove(r)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Create Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>New Promo Code</DialogTitle>
              <DialogDescription>Create a new discount code</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Display Name</label>
                <Input
                  value={create.displayName}
                  onChange={(e) =>
                    setCreate({ ...create, displayName: e.target.value })
                  }
                />
                {createErrors.displayName && (
                  <div className="text-xs text-red-600 mt-1">
                    {createErrors.displayName}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Promo Code</label>
                <Input
                  value={create.code}
                  onChange={(e) =>
                    setCreate({ ...create, code: e.target.value })
                  }
                />
                {createErrors.code && (
                  <div className="text-xs text-red-600 mt-1">
                    {createErrors.code}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Start Date</label>
                <Input
                  type="date"
                  value={create.startDate}
                  onChange={(e) =>
                    setCreate({ ...create, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">End Date</label>
                <Input
                  type="date"
                  value={create.endDate}
                  onChange={(e) =>
                    setCreate({ ...create, endDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Max Uses per Realtor
                </label>
                <Input
                  type="number"
                  value={create.maxUsesPerRealtor}
                  onChange={(e) =>
                    setCreate({ ...create, maxUsesPerRealtor: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Max Uses (Total)
                </label>
                <Input
                  type="number"
                  value={create.maxUsesTotal}
                  onChange={(e) =>
                    setCreate({ ...create, maxUsesTotal: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Discount Type</label>
                <select
                  className="border rounded-md w-full p-2"
                  value={create.discountType}
                  onChange={(e) =>
                    setCreate({ ...create, discountType: e.target.value })
                  }
                >
                  <option value="AMOUNT">Amount ($)</option>
                  <option value="PERCENT">Percent (%)</option>
                </select>
                {create.discountType === 'AMOUNT' ? (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500">Amount ($)</label>
                    <Input
                      value={create.discountValueDollars}
                      onChange={(e) =>
                        setCreate({
                          ...create,
                          discountValueDollars: e.target.value,
                        })
                      }
                    />
                    {createErrors.discountValueDollars && (
                      <div className="text-xs text-red-600 mt-1">
                        {createErrors.discountValueDollars}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500">Percent (%)</label>
                    <Input
                      value={create.discountPercent}
                      onChange={(e) =>
                        setCreate({
                          ...create,
                          discountPercent: e.target.value,
                        })
                      }
                    />
                    {createErrors.discountPercent && (
                      <div className="text-xs text-red-600 mt-1">
                        {createErrors.discountPercent}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Active</label>
                <div className="mt-2">
                  <Switch
                    checked={create.active}
                    onCheckedChange={(v) => setCreate({ ...create, active: v })}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs text-gray-500">
                    Applies to Services
                  </label>
                  <div className="space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                    >
                      Select all
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={deselectAll}
                    >
                      Deselect all
                    </Button>
                  </div>
                </div>
                <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {services.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={create.serviceIds.includes(s.id)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setCreate((c: any) => ({
                            ...c,
                            serviceIds: checked
                              ? [...c.serviceIds, s.id]
                              : c.serviceIds.filter(
                                  (id: string) => id !== s.id
                                ),
                          }));
                        }}
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {createErrors.form && (
              <div className="text-xs text-red-600 mt-2">
                {createErrors.form}
              </div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitCreate}>Create</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Promo Code</DialogTitle>
              <DialogDescription>Update fields below</DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500">Display Name</label>
                <Input
                  value={edit.displayName || ''}
                  onChange={(e) =>
                    setEdit({ ...edit, displayName: e.target.value })
                  }
                />
                {editErrors.displayName && (
                  <div className="text-xs text-red-600 mt-1">
                    {editErrors.displayName}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Promo Code</label>
                <Input
                  value={edit.code || ''}
                  onChange={(e) => setEdit({ ...edit, code: e.target.value })}
                />
                {editErrors.code && (
                  <div className="text-xs text-red-600 mt-1">
                    {editErrors.code}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Start Date</label>
                <Input
                  type="date"
                  value={edit.startDate || ''}
                  onChange={(e) =>
                    setEdit({ ...edit, startDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">End Date</label>
                <Input
                  type="date"
                  value={edit.endDate || ''}
                  onChange={(e) =>
                    setEdit({ ...edit, endDate: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Max Uses per Realtor
                </label>
                <Input
                  type="number"
                  value={edit.maxUsesPerRealtor ?? ''}
                  onChange={(e) =>
                    setEdit({ ...edit, maxUsesPerRealtor: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Max Uses (Total)
                </label>
                <Input
                  type="number"
                  value={edit.maxUsesTotal ?? ''}
                  onChange={(e) =>
                    setEdit({ ...edit, maxUsesTotal: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Discount Type</label>
                <select
                  className="border rounded-md w-full p-2"
                  value={edit.discountType || 'AMOUNT'}
                  onChange={(e) =>
                    setEdit({ ...edit, discountType: e.target.value })
                  }
                >
                  <option value="AMOUNT">Amount ($)</option>
                  <option value="PERCENT">Percent (%)</option>
                </select>
                {edit.discountType === 'AMOUNT' ? (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500">Amount ($)</label>
                    <Input
                      value={edit.discountValueDollars || ''}
                      onChange={(e) =>
                        setEdit({
                          ...edit,
                          discountValueDollars: e.target.value,
                        })
                      }
                    />
                    {editErrors.discountValueDollars && (
                      <div className="text-xs text-red-600 mt-1">
                        {editErrors.discountValueDollars}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-2">
                    <label className="text-xs text-gray-500">Percent (%)</label>
                    <Input
                      value={edit.discountPercent || ''}
                      onChange={(e) =>
                        setEdit({ ...edit, discountPercent: e.target.value })
                      }
                    />
                    {editErrors.discountPercent && (
                      <div className="text-xs text-red-600 mt-1">
                        {editErrors.discountPercent}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div>
                <label className="text-xs text-gray-500">Active</label>
                <div className="mt-2">
                  <Switch
                    checked={!!edit.active}
                    onCheckedChange={(v) => setEdit({ ...edit, active: v })}
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="text-xs text-gray-500">
                  Applies to Services
                </label>
                <div className="mt-2 max-h-48 overflow-y-auto border rounded-md p-2">
                  {services.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 py-1">
                      <input
                        type="checkbox"
                        checked={edit.serviceIds?.includes(s.id) || false}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setEdit((c: any) => ({
                            ...c,
                            serviceIds: checked
                              ? [...(c.serviceIds || []), s.id]
                              : (c.serviceIds || []).filter(
                                  (id: string) => id !== s.id
                                ),
                          }));
                        }}
                      />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            {editErrors.form && (
              <div className="text-xs text-red-600 mt-2">{editErrors.form}</div>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitEdit}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
        <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Promo Code</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Toaster />
      </AdminTwoColumnShell>
    </div>
  );
}

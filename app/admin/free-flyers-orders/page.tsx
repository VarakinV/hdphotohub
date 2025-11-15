'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
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
import { Loader2, Copy as CopyIcon, Trash2 } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
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

interface LeadRow {
  id: string;
  createdAt: string;
  propertyAddress: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function FreeFlyersOrdersPage() {
  const [rows, setRows] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    start?: string;
    end?: string;
    q?: string;
  }>({});

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams();
        if (filters.start) q.set('start', filters.start);
        if (filters.end) q.set('end', filters.end);
        const res = await fetch(
          `/api/admin/free-flyers-orders?${q.toString()}`,
          { cache: 'no-store' }
        );
        const data = await res.json();
        setRows(data || []);
      } catch (e) {
        console.error('Failed to load free flyers leads', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.start, filters.end]);

  const filtered = useMemo(() => {
    const q = (filters.q || '').trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const name = `${r.firstName} ${r.lastName}`.toLowerCase();
      return (
        (r.propertyAddress || '').toLowerCase().includes(q) || name.includes(q)
      );
    });
  }, [rows, filters.q]);

  const [page, setPage] = useState(1);
  const perPage = 20;
  useEffect(() => setPage(1), [filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page]
  );

  async function onCopyLink(id: string) {
    try {
      const origin = window.location.origin;
      await navigator.clipboard.writeText(`${origin}/free-flyers/${id}`);
      toast.success('Link copied');
    } catch (e: any) {
      toast.error('Failed to copy link');
    }
  }
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  async function onDeleteConfirmed() {
    if (!deleteId) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/admin/free-flyers-orders/${deleteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setRows((rs) => rs.filter((r) => r.id !== deleteId));
      toast.success('Order deleted');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete');
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Free Flyers Orders
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                View and manage free flyers submissions
              </p>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">From:</span>
            <Input
              type="date"
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  start: e.target.value || undefined,
                }))
              }
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">To:</span>
            <Input
              type="date"
              onChange={(e) =>
                setFilters((f) => ({ ...f, end: e.target.value || undefined }))
              }
            />
          </div>
          <div className="ml-auto w-full sm:w-64">
            <Input
              placeholder="Search address or name..."
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
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
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Date</TableHead>
                    <TableHead className="w-[260px]">Address</TableHead>
                    <TableHead className="w-[220px]">Contact</TableHead>
                    <TableHead className="text-right w-[120px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="w-[180px] max-w-[180px] truncate">
                        {new Date(r.createdAt).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </TableCell>
                      <TableCell className="w-[260px] max-w-[260px]">
                        <div
                          className="truncate whitespace-nowrap"
                          title={r.propertyAddress || ''}
                        >
                          {r.propertyAddress}
                        </div>
                      </TableCell>
                      <TableCell className="w-[220px] max-w-[220px]">
                        <div
                          className="truncate text-sm font-medium"
                          title={`${r.firstName} ${r.lastName}`}
                        >
                          {r.firstName} {r.lastName}
                        </div>
                        <div
                          className="truncate text-xs text-gray-600"
                          title={r.email}
                        >
                          {r.email}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => onCopyLink(r.id)}
                            aria-label="Copy Link"
                          >
                            <CopyIcon className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => setDeleteId(r.id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteId}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this order?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone and will remove associated files from
              storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={onDeleteConfirmed}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  );
}

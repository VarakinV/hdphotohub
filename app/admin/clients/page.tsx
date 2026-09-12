'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import { RealtorForm } from '@/components/realtors/realtor-form';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Plus,
  Pencil,
  Loader2,
  Mail,
  Phone,
  AlertCircle,
  UsersRound,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  PageHead,
} from '@/components/admin/ui/page-head';
import { SearchField } from '@/components/admin/ui/search-field';
import { Pager } from '@/components/admin/ui/pager';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { TableShell } from '@/components/admin/ui/table-shell';
import { Toolbar, DeleteIconButton } from '@/components/admin/ui/icon-action';

interface Realtor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  headshot?: string | null;
  createdAt: string;
  points?: number | null;
}

const AVATAR_COLORS = ['#cb4154', '#22305c', '#a8323f', '#334577', '#8a2735'];

export default function ClientsPage() {
  const router = useRouter();
  const [realtors, setRealtors] = useState<Realtor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null);
  const [deleteRealtor, setDeleteRealtor] = useState<Realtor | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [s3Status, setS3Status] = useState<{
    isConfigured: boolean;
    bucketName?: string | null;
  }>({ isConfigured: false });

  const [query, setQuery] = useState('');

  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return realtors;
    return realtors.filter((r) => {
      const name = `${r.firstName} ${r.lastName}`.toLowerCase();
      const email = (r.email || '').toLowerCase();
      const phone = (r.phone || '').toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q);
    });
  }, [realtors, query]);

  useEffect(() => {
    setPage(1);
  }, [realtors, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );

  // Fetch realtors
  const fetchRealtors = async () => {
    try {
      const response = await fetch('/api/realtors');
      if (!response.ok) {
        throw new Error('Failed to fetch realtors');
      }
      const data = await response.json();
      setRealtors(data);
    } catch (error) {
      console.error('Error fetching realtors:', error);
      toast.error('Failed to load realtors');
    } finally {
      setIsLoading(false);
    }
  };

  // Check S3 status
  const checkS3Status = async () => {
    try {
      const response = await fetch('/api/s3-status');
      if (response.ok) {
        const data = await response.json();
        setS3Status(data);
      }
    } catch (error) {
      console.error('Error checking S3 status:', error);
    }
  };

  useEffect(() => {
    fetchRealtors();
    checkS3Status();
  }, []);

  // Handle add/edit dialog
  const handleOpenDialog = (realtor?: Realtor) => {
    setSelectedRealtor(realtor || null);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('new') === '1') {
      handleOpenDialog();
      router.replace('/admin/clients', { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCloseDialog = () => {
    setSelectedRealtor(null);
    setIsDialogOpen(false);
    fetchRealtors(); // Refresh the list
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteRealtor) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/realtors/${deleteRealtor.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        try {
          const data = await response.json();
          const msg = data?.error || 'Failed to delete realtor';
          if (Array.isArray(data?.details)) {
            data.details.forEach((d: string) => toast.error(d));
          } else {
            toast.error(msg);
          }
        } catch {
          toast.error('Failed to delete realtor');
        }
        return;
      }

      toast.success('Realtor deleted successfully');
      fetchRealtors(); // Refresh the list
    } catch (error) {
      console.error('Error deleting realtor:', error);
      toast.error('Failed to delete realtor');
    } finally {
      setIsDeleting(false);
      setDeleteRealtor(null);
    }
  };

  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const canEditPoints = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

  return (
    <div className="w-full">
      <PageHead
        title="Clients"
        subtitle="Manage your realtor clients"
        actions={
          <button
            type="button"
            onClick={() => handleOpenDialog()}
                className="inline-flex h-9 items-center gap-2 rounded-full bg-navy-700 px-4 text-[13.5px] font-semibold text-white hover:bg-navy-600 dark:bg-navy-600 dark:hover:bg-[#3a4d85]"
          >
            <Plus className="h-4 w-4" /> Add realtor
          </button>
        }
      />

      {/* S3 Configuration Notice */}
      {!s3Status.isConfigured && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-surface-2 p-3.5 text-[12.8px] text-muted-foreground">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#9a6a12] dark:text-[#f0c674]" />
          <div>
            <p className="font-semibold text-foreground">
              File uploads are currently disabled
            </p>
            <p className="mt-0.5">
              Configure AWS S3 credentials to enable headshot uploads. You can
              still create and manage realtors without headshots.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-faint" />
        </div>
      ) : realtors.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card">
          <EmptyState
            icon={UsersRound}
            title="No realtors yet"
            description="Get started by adding your first realtor client"
            action={
              <button
                type="button"
                onClick={() => handleOpenDialog()}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-navy-700 px-4 text-[13.5px] font-semibold text-white hover:bg-navy-600 dark:bg-navy-600 dark:hover:bg-[#3a4d85]"
              >
                <Plus className="h-4 w-4" /> Add your first realtor
              </button>
            }
          />
        </div>
      ) : (
        <TableShell
          toolbar={
            <Toolbar>
              <SearchField
                value={query}
                onChange={setQuery}
                placeholder="Search name, email, or phone…"
              />
            </Toolbar>
          }
          footer={
            <Pager
              page={page}
              totalPages={totalPages}
              totalItems={filtered.length}
              perPage={perPage}
              itemName="realtors"
              onPerPageChange={(n) => {
                setPerPage(n);
                setPage(1);
              }}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          }
        >
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Email</th>
                <th>Phone</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((realtor, idx) => {
                const color = AVATAR_COLORS[idx % AVATAR_COLORS.length];
                return (
                  <tr key={realtor.id} className="border-b border-border last:border-b-0 hover:bg-surface-2">
                    <td data-label="Client" className="td-primary">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="h-[34px] w-[34px]">
                          <AvatarImage src={realtor.headshot || undefined} />
                          <AvatarFallback
                            className="font-display text-[12px] font-semibold text-white"
                            style={{ backgroundColor: color }}
                          >
                            {realtor.firstName[0]}
                            {realtor.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <Link
                          href={`/admin/clients/${realtor.id}`}
                          className="font-semibold text-navy-700 hover:underline dark:text-[#9db5f2]"
                        >
                          {realtor.firstName} {realtor.lastName}
                        </Link>
                      </div>
                    </td>
                    <td data-label="Email">
                      <a
                        href={`mailto:${realtor.email}`}
                        className="flex items-center gap-2 text-navy-700 hover:underline dark:text-[#9db5f2]"
                      >
                        <Mail className="h-4 w-4 shrink-0 text-faint" />
                        <span className="truncate">{realtor.email}</span>
                      </a>
                    </td>
                    <td data-label="Phone">
                      {realtor.phone ? (
                        <a
                          href={`tel:${realtor.phone}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          <Phone className="h-4 w-4 shrink-0 text-faint" />
                          {realtor.phone}
                        </a>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                    <td data-label="Actions">
                      <div className="flex items-center justify-start gap-1.5 md:justify-end">
                        <Link
                          href={`/admin/clients/${realtor.id}/users`}
                          className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[12.5px] font-semibold text-muted-foreground hover:border-navy-600 hover:text-foreground"
                        >
                          Send invite
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleOpenDialog(realtor)}
                          aria-label={`Edit ${realtor.firstName} ${realtor.lastName}`}
                          title="Edit"
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:border-brick-tint-strong hover:text-brick-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <DeleteIconButton
                          label={`Delete ${realtor.firstName} ${realtor.lastName}`}
                          onClick={() => setDeleteRealtor(realtor)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableShell>
      )}

      {/* Add/Edit Modal */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedRealtor(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedRealtor ? 'Edit Realtor' : 'Add New Realtor'}
            </DialogTitle>
            <DialogDescription>
              {selectedRealtor
                ? "Update the realtor's information below"
                : "Enter the realtor's information below"}
            </DialogDescription>
          </DialogHeader>

          <div className="pb-4 pt-2">
            <RealtorForm
              realtor={selectedRealtor || undefined}
              canEditPoints={canEditPoints}
              onSuccess={handleCloseDialog}
              onCancel={() => setIsDialogOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteRealtor}
        onOpenChange={(open) => !open && setDeleteRealtor(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deleteRealtor?.firstName}{' '}
              {deleteRealtor?.lastName} and remove their headshot from storage.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
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

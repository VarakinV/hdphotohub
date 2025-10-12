'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { RealtorForm } from '@/components/realtors/realtor-form';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Mail,
  Phone,
  AlertCircle,
} from 'lucide-react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import { Input } from '@/components/ui/input';
import { useSession } from 'next-auth/react';

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

export default function ClientsPage() {
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
  const perPage = 20;

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
    [filtered, page]
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
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your realtor clients
              </p>
            </div>
            <div className="flex gap-4">
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add Realtor
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {/* S3 Configuration Notice */}
        {!s3Status.isConfigured && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">
                  Note: File uploads are currently disabled
                </p>
                <p className="mt-1">
                  To enable headshot uploads, configure AWS S3 credentials in
                  your environment variables. You can still create and manage
                  realtors without headshots.
                </p>
              </div>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : realtors.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No realtors yet
            </h3>
            <p className="text-gray-600 mb-4">
              Get started by adding your first realtor client
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Realtor
            </Button>
          </div>
        ) : (
          <>
            {/* Search bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-4 flex items-center gap-3">
              <div className="ml-auto w-full sm:w-80">
                <Input
                  placeholder="Search name, email, or phone..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Headshot</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((realtor) => (
                    <TableRow key={realtor.id}>
                      <TableCell>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={realtor.headshot || undefined} />
                          <AvatarFallback>
                            {realtor.firstName[0]}
                            {realtor.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell className="font-medium">
                        {realtor.firstName} {realtor.lastName}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a
                            href={`mailto:${realtor.email}`}
                            className="text-blue-600 hover:underline"
                          >
                            {realtor.email}
                          </a>
                        </div>
                      </TableCell>
                      <TableCell>
                        {realtor.phone ? (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a
                              href={`tel:${realtor.phone}`}
                              className="text-blue-600 hover:underline"
                            >
                              {realtor.phone}
                            </a>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDialog(realtor)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="default" size="sm" asChild>
                            <Link href={`/admin/clients/${realtor.id}/users`}>
                              Send Invite
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDeleteRealtor(realtor)}
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
              {!isLoading && (
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </AdminTwoColumnShell>

      {/* Add/Edit Modal */}
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) setSelectedRealtor(null);
        }}
      >
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader className="sticky top-0 z-10 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
            <DialogTitle>
              {selectedRealtor ? 'Edit Realtor' : 'Add New Realtor'}
            </DialogTitle>
            <DialogDescription>
              {selectedRealtor
                ? "Update the realtor's information below"
                : "Enter the realtor's information below"}
            </DialogDescription>
          </DialogHeader>

          <div className="pt-2 pb-4">
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

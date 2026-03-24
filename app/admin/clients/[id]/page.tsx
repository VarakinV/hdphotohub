'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { RealtorForm } from '@/components/realtors/realtor-form';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Mail,
  Phone,
  Building2,
  Loader2,
  Pencil,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { useSession } from 'next-auth/react';

interface Realtor {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  headshot?: string | null;
  companyName?: string | null;
  companyLogo?: string | null;
  facebookUrl?: string | null;
  linkedinUrl?: string | null;
  instagramUrl?: string | null;
  youtubeUrl?: string | null;
  twitterUrl?: string | null;
  pinterestUrl?: string | null;
  vimeoUrl?: string | null;
  tiktokUrl?: string | null;
  points?: number | null;
}

interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export default function RealtorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const canEditPoints = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

  const [realtor, setRealtor] = useState<Realtor | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  // Points state
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txPerPage, setTxPerPage] = useState(20);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txLoading, setTxLoading] = useState(false);

  // Add/redeem form
  const [pointsMode, setPointsMode] = useState<'add' | 'redeem' | null>(null);
  const [pointsDelta, setPointsDelta] = useState('');
  const [pointsReason, setPointsReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRealtor = useCallback(async () => {
    try {
      const res = await fetch(`/api/realtors/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setRealtor(data);
      setBalance(data.points ?? 0);
    } catch {
      toast.error('Failed to load realtor');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const res = await fetch(
        `/api/realtors/${id}/points?page=${txPage}&perPage=${txPerPage}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBalance(data.balance);
      setTransactions(data.transactions);
      setTxTotal(data.total);
      setTxTotalPages(data.totalPages);
    } catch {
      toast.error('Failed to load point history');
    } finally {
      setTxLoading(false);
    }
  }, [id, txPage, txPerPage]);

  useEffect(() => {
    fetchRealtor();
  }, [fetchRealtor]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSubmitPoints = async () => {
    const amount = Math.abs(Math.round(Number(pointsDelta)));
    if (!amount || !pointsReason.trim() || !pointsMode) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/realtors/${id}/points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          type: pointsMode,
          reason: pointsReason.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed');
      }
      const data = await res.json();
      setBalance(data.balance);
      toast.success(
        pointsMode === 'add'
          ? `Added ${amount.toLocaleString()} points`
          : `Redeemed ${amount.toLocaleString()} points`
      );
      setPointsMode(null);
      setPointsDelta('');
      setPointsReason('');
      setTxPage(1);
      fetchTransactions();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update points');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <AdminNavbar />
        <AdminTwoColumnShell>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </AdminTwoColumnShell>
      </div>
    );
  }

  if (!realtor) {
    return (
      <div className="min-h-screen">
        <AdminNavbar />
        <AdminTwoColumnShell>
          <div className="text-center py-20 text-gray-500">
            Realtor not found.{' '}
            <Link href="/admin/clients" className="text-primary underline">
              Back to clients
            </Link>
          </div>
        </AdminTwoColumnShell>
      </div>
    );
  }

  const initials =
    ((realtor.firstName?.[0] || '') + (realtor.lastName?.[0] || '')).toUpperCase() || '?';

  return (
    <div className="min-h-screen">
      <AdminNavbar />
      <Toaster richColors position="top-right" />

      {/* Page header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/clients"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <Avatar className="h-12 w-12">
              {realtor.headshot ? (
                <AvatarImage src={realtor.headshot} alt={realtor.firstName} />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {realtor.firstName} {realtor.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                {realtor.email && (
                  <span className="flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5" /> {realtor.email}
                  </span>
                )}
                {realtor.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5" /> {realtor.phone}
                  </span>
                )}
                {realtor.companyName && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" /> {realtor.companyName}
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit
            </Button>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {/* Points Management Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" /> Loyalty Points
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Current Balance:{' '}
                <span className="font-bold text-gray-900 text-lg">
                  {balance.toLocaleString()}
                </span>
              </p>
            </div>
            {canEditPoints && !pointsMode && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => setPointsMode('add')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setPointsMode('redeem')}
                >
                  <Minus className="h-4 w-4 mr-1" /> Redeem
                </Button>
              </div>
            )}
          </div>

          {/* Add / Redeem inline form */}
          {pointsMode && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50 space-y-3">
              <p className="text-sm font-medium">
                {pointsMode === 'add' ? 'Add Points' : 'Redeem Points'}
              </p>
              <div className="flex gap-3">
                <Input
                  type="number"
                  min={1}
                  placeholder="Amount"
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(e.target.value)}
                  className="w-32"
                />
                <Input
                  placeholder="Reason (required)"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="flex-1"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={
                    submitting ||
                    !pointsDelta ||
                    Number(pointsDelta) <= 0 ||
                    !pointsReason.trim()
                  }
                  onClick={handleSubmitPoints}
                  className={
                    pointsMode === 'add'
                      ? 'bg-green-600 hover:bg-green-700'
                      : ''
                  }
                  variant={pointsMode === 'redeem' ? 'destructive' : 'default'}
                >
                  {submitting && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Confirm
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setPointsMode(null);
                    setPointsDelta('');
                    setPointsReason('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}


          {/* History table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Points</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txLoading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="text-center py-8 text-gray-400"
                    >
                      No point transactions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell
                        className={`text-right font-semibold tabular-nums ${
                          tx.amount > 0
                            ? 'text-green-600'
                            : tx.amount < 0
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        {tx.amount > 0 ? '+' : ''}
                        {tx.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {tx.reason}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {txTotalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
              <span>
                Page {txPage} of {txTotalPages} ({txTotal} total)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={txPage <= 1}
                  onClick={() => setTxPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={txPage >= txTotalPages}
                  onClick={() => setTxPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </AdminTwoColumnShell>

      {/* Edit Realtor Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Realtor</DialogTitle>
            <DialogDescription>
              Update {realtor.firstName}&apos;s information.
            </DialogDescription>
          </DialogHeader>
          <RealtorForm
            realtor={realtor}
            onSuccess={() => {
              setEditOpen(false);
              fetchRealtor();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
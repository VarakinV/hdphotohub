'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
      <div className="w-full">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-faint" />
        </div>
      </div>
    );
  }

  if (!realtor) {
    return (
      <div className="w-full">
        <div className="py-20 text-center text-muted-foreground">
          Realtor not found.{' '}
          <Link href="/admin/clients" className="text-brick-600 underline dark:text-brick-500">
            Back to clients
          </Link>
        </div>
      </div>
    );
  }

  const initials =
    ((realtor.firstName?.[0] || '') + (realtor.lastName?.[0] || '')).toUpperCase() || '?';

  return (
    <div className="w-full">
      <Toaster richColors position="top-right" />

      {/* Profile header */}
      <div className="mb-5">
        <Link
          href="/admin/clients"
          className="mb-2 inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-brick-600"
        >
          <ArrowLeft className="h-4 w-4" /> All clients
        </Link>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="h-12 w-12">
            {realtor.headshot ? (
              <AvatarImage src={realtor.headshot} alt={realtor.firstName} />
            ) : (
              <AvatarFallback className="bg-brick-500 font-display text-sm font-semibold text-white">
                {initials}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="font-display truncate text-[22px] font-semibold leading-tight">
              {realtor.firstName} {realtor.lastName}
            </h2>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
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
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex h-8 items-center gap-2 rounded-full border border-border px-4 text-[13px] font-semibold hover:border-navy-600 hover:bg-surface-2"
          >
            <Pencil className="h-4 w-4" /> Edit
          </button>
        </div>
      </div>

      {/* Points Management Card */}
      <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display flex items-center gap-2 text-[16px] font-semibold">
              <Sparkles className="h-5 w-5 text-[#e2a93b] dark:text-[#f0c674]" /> Loyalty Points
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Current Balance:{' '}
              <span className="num text-lg font-bold text-foreground">
                {balance.toLocaleString()}
              </span>
            </p>
          </div>
          {canEditPoints && !pointsMode && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPointsMode('add')}
                className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[#1c7a41] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[#166534]"
              >
                <Plus className="h-4 w-4" /> Add
              </button>
              <button
                type="button"
                onClick={() => setPointsMode('redeem')}
                className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-brick-tint px-3.5 text-[12.5px] font-semibold text-brick-600 hover:bg-brick-tint-strong"
              >
                <Minus className="h-4 w-4" /> Redeem
              </button>
            </div>
          )}
        </div>

        {/* Add / Redeem inline form */}
        {pointsMode && (
          <div className="mb-4 space-y-3 rounded-xl border border-border bg-surface-2 p-4">
            <p className="text-sm font-medium">
              {pointsMode === 'add' ? 'Add Points' : 'Redeem Points'}
            </p>
            <div className="flex flex-wrap gap-3">
              <input
                type="number"
                min={1}
                placeholder="Amount"
                value={pointsDelta}
                onChange={(e) => setPointsDelta(e.target.value)}
                className="field w-32"
              />
              <input
                placeholder="Reason (required)"
                value={pointsReason}
                onChange={(e) => setPointsReason(e.target.value)}
                className="field flex-1"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={
                  submitting ||
                  !pointsDelta ||
                  Number(pointsDelta) <= 0 ||
                  !pointsReason.trim()
                }
                onClick={handleSubmitPoints}
                className={
                  pointsMode === 'add'
                    ? 'inline-flex h-8 items-center gap-1.5 rounded-full bg-[#1c7a41] px-3.5 text-[12.5px] font-semibold text-white hover:bg-[#166534] disabled:opacity-50'
                    : 'inline-flex h-8 items-center gap-1.5 rounded-full bg-brick-500 px-3.5 text-[12.5px] font-semibold text-white hover:bg-brick-600 disabled:opacity-50'
                }
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Confirm
              </button>
              <button
                type="button"
                onClick={() => {
                  setPointsMode(null);
                  setPointsDelta('');
                  setPointsReason('');
                }}
                className="inline-flex h-8 items-center rounded-full border border-border px-3.5 text-[12.5px] font-semibold text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* History table */}
        <div className="table-responsive overflow-hidden rounded-xl border border-border">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-right">Points</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {txLoading ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-faint" />
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-faint">
                    No point transactions yet.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-border last:border-b-0 hover:bg-surface-2">
                    <td data-label="Date" className="text-[13px] whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td
                      data-label="Points"
                      className={`num text-right font-semibold ${
                        tx.amount > 0
                          ? 'text-[#1c7a41] dark:text-[#7fe0a3]'
                          : tx.amount < 0
                          ? 'text-[#c23434] dark:text-[#f09a9a]'
                          : ''
                      }`}
                    >
                      {tx.amount > 0 ? '+' : ''}
                      {tx.amount.toLocaleString()}
                    </td>
                    <td data-label="Reason" className="text-[13px] text-muted-foreground">
                      {tx.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {txTotalPages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {txPage} of {txTotalPages} ({txTotal} total)
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={txPage <= 1}
                onClick={() => setTxPage((p) => p - 1)}
                className="inline-flex h-8 items-center rounded-full border border-border px-3.5 text-[12.5px] font-semibold text-muted-foreground disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={txPage >= txTotalPages}
                onClick={() => setTxPage((p) => p + 1)}
                className="inline-flex h-8 items-center rounded-full border border-border px-3.5 text-[12.5px] font-semibold text-muted-foreground disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Realtor Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
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
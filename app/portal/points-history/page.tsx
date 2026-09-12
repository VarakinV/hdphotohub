'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PageHead } from '@/components/admin/ui/page-head';
import { Pager } from '@/components/admin/ui/pager';
import { Loader2, Sparkles } from 'lucide-react';

interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export default function PortalPointsHistoryPage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const realtorId = user?.realtorId;

  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const perPage = 20;

  const fetchHistory = useCallback(async () => {
    if (!realtorId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/realtors/${realtorId}/points?page=${page}&perPage=${perPage}`
      );
      if (!res.ok) throw new Error();
      const data = await res.json();
      setBalance(data.balance);
      setTransactions(data.transactions);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [realtorId, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  if (status === 'loading') {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-faint" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        Please{' '}
        <Link href="/login" className="underline text-primary">
          sign in
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHead title="Points History" subtitle="Your earned and redeemed points" />

      <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-6">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display flex items-center gap-2 text-[16px] font-semibold">
              <Sparkles className="h-5 w-5 text-[#9a6a12] dark:text-[#f0c674]" /> Points History
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Current Balance:{' '}
              <span className="num text-lg font-bold text-foreground">
                {balance.toLocaleString()}
              </span>
            </p>
          </div>
        </div>

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
              {loading ? (
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
                  <tr
                    key={tx.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-2"
                  >
                    <td data-label="Date" className="whitespace-nowrap">
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
                    <td data-label="Reason" className="text-muted-foreground">
                      {tx.reason}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="mt-3">
            <Pager
              page={page}
              totalPages={totalPages}
              totalItems={total}
              perPage={perPage}
              itemName="transactions"
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
            />
          </div>
        )}
      </div>
    </div>
  );
}

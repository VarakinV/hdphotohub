'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { PortalNavbar } from '@/components/portal/portal-navbar';
import PortalTwoColumnShell from '@/components/portal/PortalTwoColumnShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  const fetchHistory = useCallback(async () => {
    if (!realtorId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/realtors/${realtorId}/points?page=${page}&perPage=20`
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
      <div className="min-h-screen bg-gray-50">
        <PortalNavbar />
        <PortalTwoColumnShell>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        </PortalTwoColumnShell>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PortalNavbar />
        <PortalTwoColumnShell>
          <div className="text-center py-20 text-gray-500">
            Please{' '}
            <Link href="/login" className="underline text-primary">
              sign in
            </Link>
            .
          </div>
        </PortalTwoColumnShell>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />
      <PortalTwoColumnShell>
        <Card className="bg-white rounded-lg shadow p-4">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" /> Points History
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Current Balance:{' '}
                <span className="font-bold text-gray-900 text-lg">
                  {balance.toLocaleString()}
                </span>
              </p>
            </div>
          </div>

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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-gray-400" />
                    </TableCell>
                  </TableRow>
                ) : transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-400">
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

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
              <span>
                Page {page} of {totalPages} ({total} total)
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      </PortalTwoColumnShell>
    </div>
  );
}


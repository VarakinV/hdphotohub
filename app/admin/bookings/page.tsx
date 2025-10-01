'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';

interface BookingRow {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  start: string;
  end: string;
  propertyFormattedAddress?: string | null;
  propertyAddress: string;
  contactName: string;
  contactEmail: string;
  totalCents: number;
}

export default function BookingsPage() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    status?: string;
    start?: string;
    end?: string;
    q?: string;
  }>({});

  useEffect(() => {
    const load = async () => {
      try {
        const q = new URLSearchParams();
        if (filters.status) q.set('status', filters.status);
        if (filters.start) q.set('start', filters.start);
        if (filters.end) q.set('end', filters.end);
        const res = await fetch(`/api/bookings?${q.toString()}`);
        const data = await res.json();
        setRows(data);
      } catch (e) {
        console.error('Failed to load bookings', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [filters.status, filters.start, filters.end]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filters.q) {
        const addr = r.propertyFormattedAddress || r.propertyAddress;
        if (!addr.toLowerCase().includes(filters.q.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, filters.q]);

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
  function money(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
              <p className="text-sm text-gray-600 mt-1">
                View incoming booking requests
              </p>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <Select
              defaultValue="ALL"
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  status: v === 'ALL' ? undefined : v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              placeholder="Search address..."
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
                    <TableHead className="w-[72px]">Status</TableHead>

                    <TableHead className="w-[180px]">When</TableHead>
                    <TableHead className="w-[200px]">Property</TableHead>
                    <TableHead className="w-[160px]">Contact</TableHead>
                    <TableHead className="text-right w-[100px]">
                      Total
                    </TableHead>
                    <TableHead className="text-right w-[100px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="w-[72px]">
                        {r.status === 'CONFIRMED' ? (
                          <span
                            title="Confirmed"
                            className="inline-flex items-center text-green-600"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </span>
                        ) : r.status === 'CANCELLED' ? (
                          <span
                            title="Cancelled"
                            className="inline-flex items-center text-red-600"
                          >
                            <XCircle className="h-5 w-5" />
                          </span>
                        ) : (
                          <span
                            title="Pending"
                            className="inline-flex items-center text-amber-600"
                          >
                            <Clock className="h-5 w-5" />
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="w-[180px] max-w-[180px] truncate">
                        {new Date(r.start).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                        })}
                      </TableCell>
                      <TableCell className="w-[200px] max-w-[200px]">
                        <div
                          className="truncate whitespace-nowrap"
                          title={
                            (r.propertyFormattedAddress || r.propertyAddress) ??
                            ''
                          }
                        >
                          {r.propertyFormattedAddress || r.propertyAddress}
                        </div>
                      </TableCell>
                      <TableCell className="w-[160px] max-w-[160px]">
                        <div
                          className="truncate text-sm font-medium"
                          title={r.contactName}
                        >
                          {r.contactName}
                        </div>
                        <div
                          className="truncate text-xs text-gray-600"
                          title={r.contactEmail}
                        >
                          {r.contactEmail}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {money(r.totalCents)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/bookings/${r.id}`}>View</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {/* Pagination */}
              {!loading && (
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
            </>
          )}
        </div>
      </AdminTwoColumnShell>
    </div>
  );
}

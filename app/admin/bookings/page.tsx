'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { PageHead } from '@/components/admin/ui/page-head';
import { Pager } from '@/components/admin/ui/pager';
import { SearchField } from '@/components/admin/ui/search-field';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { TableShell } from '@/components/admin/ui/table-shell';
import { Toolbar } from '@/components/admin/ui/icon-action';
import { StatusPill } from '@/components/admin/ui/status-pill';
import { Loader2, CalendarX } from 'lucide-react';

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
  const [perPage, setPerPage] = useState(20);
  useEffect(() => {
    setPage(1);
  }, [filters]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const pageItems = useMemo(
    () => filtered.slice((page - 1) * perPage, page * perPage),
    [filtered, page, perPage]
  );
  function money(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  return (
    <div className="w-full">
      <PageHead title="Bookings" subtitle="View incoming booking requests" />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-faint" />
        </div>
      ) : (
        <TableShell
          toolbar={
            <Toolbar>
              <div className="flex items-center gap-2">
                <span className="hidden text-[13px] text-muted-foreground sm:inline">
                  Status:
                </span>
                <Select
                  defaultValue="ALL"
                  onValueChange={(v) =>
                    setFilters((f) => ({
                      ...f,
                      status: v === 'ALL' ? undefined : v,
                    }))
                  }
                >
                  <SelectTrigger className="w-[140px]">
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
                <span className="hidden text-[13px] text-muted-foreground sm:inline">
                  From:
                </span>
                <Input
                  type="date"
                  className="w-[150px]"
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      start: e.target.value || undefined,
                    }))
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden text-[13px] text-muted-foreground sm:inline">
                  To:
                </span>
                <Input
                  type="date"
                  className="w-[150px]"
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, end: e.target.value || undefined }))
                  }
                />
              </div>
              <div className="ml-auto w-full sm:w-64">
                <SearchField
                  value={filters.q || ''}
                  onChange={(v) => setFilters((f) => ({ ...f, q: v }))}
                  placeholder="Search address…"
                  ariaLabel="Search address"
                />
              </div>
            </Toolbar>
          }
          footer={
            filtered.length > 0 ? (
              <Pager
                page={page}
                totalPages={totalPages}
                totalItems={filtered.length}
                perPage={perPage}
                itemName="bookings"
                onPerPageChange={(n) => {
                  setPerPage(n);
                  setPage(1);
                }}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
              />
            ) : undefined
          }
        >
          {pageItems.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="No bookings found"
              description="No bookings match the current filters."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>When</th>
                  <th>Property</th>
                  <th>Contact</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-2"
                  >
                    <td data-label="Status" className="td-primary">
                      <StatusPill status={r.status} />
                    </td>
                    <td data-label="When" className="whitespace-nowrap">
                      {new Date(r.start).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </td>
                    <td data-label="Property">
                      <div
                        className="max-w-[260px] truncate"
                        title={
                          (r.propertyFormattedAddress || r.propertyAddress) ??
                          ''
                        }
                      >
                        {r.propertyFormattedAddress || r.propertyAddress}
                      </div>
                    </td>
                    <td data-label="Contact">
                      <div className="max-w-[180px] truncate text-[13px] font-medium" title={r.contactName}>
                        {r.contactName}
                      </div>
                      <div
                        className="max-w-[180px] truncate text-xs text-muted-foreground"
                        title={r.contactEmail}
                      >
                        {r.contactEmail}
                      </div>
                    </td>
                    <td data-label="Total" className="num text-right">
                      {money(r.totalCents)}
                    </td>
                    <td data-label="Actions" className="text-right">
                      <Link
                        href={`/admin/bookings/${r.id}`}
                        className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[12.5px] font-semibold text-muted-foreground hover:border-navy-600 hover:text-foreground"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </TableShell>
      )}
    </div>
  );
}

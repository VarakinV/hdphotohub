'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHead } from '@/components/admin/ui/page-head';
import { Pager } from '@/components/admin/ui/pager';
import { SearchField } from '@/components/admin/ui/search-field';
import { StatusPill } from '@/components/admin/ui/status-pill';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { Toolbar, DeleteIconButton } from '@/components/admin/ui/icon-action';
import { TableShell } from '@/components/admin/ui/table-shell';
import { Switch } from '@/components/ui/switch';

import { Loader2, Plus, ChevronDown, X, PackageOpen } from 'lucide-react';
import { CopyDeliveryLinkIcon } from '@/components/admin/CopyDeliveryLinkIcon';

interface RealtorOption {
  id: string;
  name: string;
}

interface OrderRow {
  id: string;
  propertyAddress: string;
  realtor: { id: string; firstName: string; lastName: string };
  mlsNumber?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt: string;
}

function RealtorSearchFilter({
  realtors,
  value,
  onChange,
}: {
  realtors: RealtorOption[];
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = React.useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return realtors;
    const q = search.toLowerCase();
    return realtors.filter((r) => r.name.toLowerCase().includes(q));
  }, [realtors, search]);

  const selectedName = realtors.find((r) => r.id === value)?.name;

  // Close on outside click
  React.useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div className="flex items-center gap-2">
      <span className="hidden text-[13px] text-muted-foreground sm:inline">
        Realtor:
      </span>
      <div ref={ref} className="relative min-w-[200px]">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-9 w-full items-center justify-between rounded-[10px] border border-border bg-card px-3 py-2 text-sm outline-none focus:border-ring focus:ring-[3px] focus:ring-ring/50"
        >
          <span className="truncate">{selectedName || 'All'}</span>
          <div className="ml-2 flex items-center gap-1">
            {value && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                  setSearch('');
                }}
                className="text-faint hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full min-w-[240px] rounded-xl border border-border bg-popover shadow-[var(--shadow-pop)]">
            <div className="border-b border-border p-2">
              <input
                autoFocus
                type="text"
                placeholder="Search realtor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field py-1.5"
              />
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { onChange(undefined); setSearch(''); setOpen(false); }}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-surface-2 ${!value ? 'bg-surface-2 font-medium' : ''}`}
              >
                All
              </button>
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { onChange(r.id); setSearch(''); setOpen(false); }}
                  className={`w-full px-3 py-1.5 text-left text-sm hover:bg-surface-2 ${value === r.id ? 'bg-surface-2 font-medium' : ''}`}
                >
                  {r.name}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-faint">No results</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [realtors, setRealtors] = useState<RealtorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    realtorId?: string;
    status?: string;
    query?: string;
  }>({});

  useEffect(() => {
    const load = async () => {
      try {
        const [ordersRes, realtorsRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/realtors'),
        ]);
        const [ordersData, realtorsData] = await Promise.all([
          ordersRes.json(),
          realtorsRes.json(),
        ]);
        setOrders(ordersData);
        setRealtors(
          realtorsData.map((r: any) => ({
            id: r.id,
            name: `${r.firstName} ${r.lastName}`,
          }))
        );
      } catch (e) {
        console.error('Failed to load orders/realtors', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filters.realtorId && o.realtor.id !== filters.realtorId) return false;
      if (filters.status && o.status !== filters.status) return false;
      if (
        filters.query &&
        !o.propertyAddress.toLowerCase().includes(filters.query.toLowerCase())
      )
        return false;
      return true;
    });
  }, [orders, filters]);

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

  return (
    <div className="w-full">
      <PageHead
        title="Orders"
        subtitle="Manage property projects"
        actions={
          <button
            type="button"
            onClick={() => (window.location.href = '/admin/orders/new')}
            className="inline-flex h-9 items-center gap-2 rounded-full bg-navy-700 px-4 text-[13.5px] font-semibold text-white hover:bg-navy-600 dark:bg-navy-600 dark:hover:bg-[#3a4d85]"
          >
            <Plus className="h-4 w-4" /> New order
          </button>
        }
      />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-faint" />
        </div>
      ) : (
        <TableShell
          toolbar={
            <Toolbar>
              <RealtorSearchFilter
                realtors={realtors}
                value={filters.realtorId}
                onChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    realtorId: v,
                  }))
                }
              />
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
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="ml-auto w-full sm:w-64">
                <SearchField
                  value={filters.query || ''}
                  onChange={(v) => setFilters((f) => ({ ...f, query: v }))}
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
                itemName="orders"
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
              icon={PackageOpen}
              title="No orders found"
              description="No orders match the current filters. Try clearing filters or create a new order."
            />
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Property Address</th>
                  <th>Realtor</th>
                  <th>MLS #</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-border last:border-b-0 hover:bg-surface-2"
                  >
                    <td data-label="Property Address" className="td-primary font-medium">
                      {o.propertyAddress}
                    </td>
                    <td data-label="Realtor">
                      {o.realtor.firstName} {o.realtor.lastName}
                    </td>
                    <td data-label="MLS #">{o.mlsNumber || '—'}</td>
                    <td data-label="Status">
                      <div className="flex items-center gap-2">
                        <Switch
                          size="sm"
                          checked={o.status === 'PUBLISHED'}
                          disabled={o.status === 'ARCHIVED'}
                          srLabel="Toggle Published"
                          onCheckedChange={async (checked) => {
                            const prev = o.status;
                            const newStatus = checked ? 'PUBLISHED' : 'DRAFT';
                            setOrders((list) =>
                              list.map((x) =>
                                x.id === o.id
                                  ? { ...x, status: newStatus }
                                  : x
                              )
                            );
                            const res = await fetch(`/api/orders/${o.id}`, {
                              method: 'PATCH',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ status: newStatus }),
                            });
                            if (!res.ok) {
                              setOrders((list) =>
                                list.map((x) =>
                                  x.id === o.id ? { ...x, status: prev } : x
                                )
                              );
                              alert('Failed to update status');
                            }
                          }}
                        />
                        <span className="text-xs text-muted-foreground">
                          {o.status}
                        </span>
                      </div>
                    </td>
                    <td data-label="Actions">
                      <div className="flex items-center justify-start gap-1.5 md:justify-end">
                        {o.status === 'PUBLISHED' && (
                          <CopyDeliveryLinkIcon orderId={o.id} />
                        )}
                        <StatusPill status={o.status} className="hidden xl:inline-flex" />
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="inline-flex h-8 items-center rounded-full border border-border px-3 text-[12.5px] font-semibold text-muted-foreground hover:border-navy-600 hover:text-foreground"
                        >
                          Open
                        </Link>
                        <DeleteIconButton
                          label="Delete order"
                          onClick={async () => {
                            if (
                              !confirm('Delete this order and all its media?')
                            )
                              return;
                            const res = await fetch(`/api/orders/${o.id}`, {
                              method: 'DELETE',
                            });
                            if (res.ok)
                              setOrders((list) =>
                                list.filter((x) => x.id !== o.id)
                              );
                            else alert('Failed to delete order');
                          }}
                        />
                      </div>
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

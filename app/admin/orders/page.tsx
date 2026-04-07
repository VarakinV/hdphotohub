'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
import { Switch } from '@/components/ui/switch';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';

import { Loader2, Plus, ChevronDown, X } from 'lucide-react';
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
      <span className="text-sm text-gray-600">Realtor:</span>
      <div ref={ref} className="relative min-w-[200px]">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <span className="truncate">{selectedName || 'All'}</span>
          <div className="flex items-center gap-1 ml-2">
            {value && (
              <span
                role="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                  setSearch('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </button>

        {open && (
          <div className="absolute z-50 mt-1 w-full min-w-[240px] rounded-md border bg-white shadow-lg">
            <div className="p-2 border-b">
              <input
                autoFocus
                type="text"
                placeholder="Search realtor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-md border border-input px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-ring"
              />
            </div>
            <div className="max-h-60 overflow-y-auto py-1">
              <button
                type="button"
                onClick={() => { onChange(undefined); setSearch(''); setOpen(false); }}
                className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${!value ? 'bg-gray-50 font-medium' : ''}`}
              >
                All
              </button>
              {filtered.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { onChange(r.id); setSearch(''); setOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 ${value === r.id ? 'bg-gray-50 font-medium' : ''}`}
                >
                  {r.name}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">No results</div>
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
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage property projects
              </p>
            </div>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/admin/orders/new">
                  <Plus className="mr-2 h-4 w-4" /> New Order
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
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
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="ml-auto w-full sm:w-64">
            <Input
              placeholder="Search address..."
              onChange={(e) =>
                setFilters((f) => ({ ...f, query: e.target.value }))
              }
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property Address</TableHead>
                    <TableHead>Realtor</TableHead>
                    <TableHead>MLS #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-medium">
                        {o.propertyAddress}
                      </TableCell>
                      <TableCell>
                        {o.realtor.firstName} {o.realtor.lastName}
                      </TableCell>
                      <TableCell>{o.mlsNumber || '—'}</TableCell>
                      <TableCell>
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
                          <span className="text-xs text-gray-600">
                            {o.status}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right flex gap-2 justify-end">
                        {o.status === 'PUBLISHED' && (
                          <CopyDeliveryLinkIcon orderId={o.id} />
                        )}
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/admin/orders/${o.id}`}>Open</Link>
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
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
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {!loading && (
                <div className="p-4 border-t flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-sm text-gray-500">
                      Page {page} of {totalPages}
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-sm text-gray-500">Rows:</label>
                      <select
                        className="h-8 rounded-md border px-2 text-sm"
                        value={perPage}
                        onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}
                      >
                        {[10, 20, 30, 50].map((n) => (
                          <option key={n} value={n}>{n}</option>
                        ))}
                      </select>
                    </div>
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

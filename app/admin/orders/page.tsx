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

import { Loader2, Plus } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gray-50">
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
              <Button variant="outline" asChild>
                <Link href="/admin/dashboard">Back to Dashboard</Link>
              </Button>
              <Button asChild>
                <Link href="/admin/orders/new">
                  <Plus className="mr-2 h-4 w-4" /> New Order
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Realtor:</span>
            <Select
              defaultValue="ALL"
              onValueChange={(v) =>
                setFilters((f) => ({
                  ...f,
                  realtorId: v === 'ALL' ? undefined : v,
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                {realtors.map((r) => (
                  <SelectItem key={r.id} value={r.id}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
                {filtered.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-medium">
                      {o.propertyAddress}
                    </TableCell>
                    <TableCell>
                      {o.realtor.firstName} {o.realtor.lastName}
                    </TableCell>
                    <TableCell>{o.mlsNumber || '—'}</TableCell>
                    <TableCell>{o.status}</TableCell>
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
                          if (!confirm('Delete this order and all its media?'))
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
          )}
        </div>
      </main>
    </div>
  );
}

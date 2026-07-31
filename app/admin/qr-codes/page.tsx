'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { QRCodeStatsDialog } from '@/components/qr/QRCodeStatsDialog';
import { QRCodeReassignDialog } from '@/components/qr/QRCodeReassignDialog';
import { Loader2, Plus, TrendingUp, Edit, Trash2, ChevronDown, X } from 'lucide-react';

interface RealtorOption {
  id: string;
  name: string;
}

interface QRCode {
  id: string;
  displayId: string;
  status: 'UNASSIGNED' | 'ACTIVE' | 'ARCHIVED';
  createdAt: string;
  assignments: {
    id: string;
    sendWeeklyStats: boolean;
    order: {
      id: string;
      propertyAddress: string;
      propertyFormattedAddress?: string | null;
      realtor: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
      };
    };
    propertyPage?: {
      id: string;
      urlPath: string;
    } | null;
  }[];
  createdByUser: {
    id: string;
    name?: string | null;
    email: string;
  };
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

export default function AdminQRCodesPage() {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [realtors, setRealtors] = useState<RealtorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{
    realtorId?: string;
    query?: string;
  }>({});
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  async function loadQRCodes() {
    setLoading(true);
    try {
      const res = await fetch('/api/qr/list');
      if (res.ok) {
        const data = await res.json();
        setQrCodes(data);
        
        const realtorMap = new Map<string, string>();
        data.forEach((qr: QRCode) => {
          qr.assignments.forEach((a) => {
            const realtor = a.order.realtor;
            if (realtor && !realtorMap.has(realtor.id)) {
              realtorMap.set(realtor.id, `${realtor.firstName} ${realtor.lastName}`);
            }
          });
        });
        setRealtors(
          Array.from(realtorMap.entries()).map(([id, name]) => ({ id, name }))
        );
      } else {
        toast.error('Failed to load QR codes');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load QR codes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQRCodes();
  }, []);

  const filtered = useMemo(() => {
    return qrCodes.filter((qr) => {
      const currentAssignment = qr.assignments[0];
      
      if (filters.realtorId) {
        if (!currentAssignment || currentAssignment.order.realtor.id !== filters.realtorId) {
          return false;
        }
      }
      
      if (filters.query) {
        const propertyAddress = currentAssignment
          ? currentAssignment.order.propertyFormattedAddress || currentAssignment.order.propertyAddress
          : '';
        const query = filters.query.toLowerCase();
        const matchesAddress = propertyAddress.toLowerCase().includes(query);
        const matchesDisplayId = qr.displayId.toLowerCase().includes(query);
        if (!matchesAddress && !matchesDisplayId) {
          return false;
        }
      }
      
      return true;
    });
  }, [qrCodes, filters]);

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

  function handleShowStats(qr: QRCode) {
    setSelectedQR(qr);
    setShowStats(true);
  }

  function handleReassign(qr: QRCode) {
    setSelectedQR(qr);
    setShowReassign(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this QR code?')) {
      return;
    }

    try {
      const res = await fetch(`/api/qr/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('QR code deleted');
        setQrCodes((list) => list.filter((x) => x.id !== id));
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete QR code');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete QR code');
    }
  }

  async function handleToggleWeeklyStats(assignmentId: string, enabled: boolean) {
    try {
      const res = await fetch(`/api/qr/${assignmentId}/send-stats`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sendWeeklyStats: enabled }),
      });
      if (res.ok) {
        toast.success('Weekly stats preference updated');
        setQrCodes((list) =>
          list.map((qr) => ({
            ...qr,
            assignments: qr.assignments.map((a) =>
              a.id === assignmentId ? { ...a, sendWeeklyStats: enabled } : a
            ),
          }))
        );
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update preference');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to update preference');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <Toaster position="bottom-right" />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">QR Codes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage QR codes for property listings
              </p>
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
                    <TableHead>Display ID</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Realtor</TableHead>
                    <TableHead>Weekly Stats</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pageItems.map((qr) => {
                    const currentAssignment = qr.assignments[0];
                    const propertyAddress = currentAssignment
                      ? currentAssignment.order.propertyFormattedAddress || currentAssignment.order.propertyAddress
                      : 'Unassigned';
                    const realtorName = currentAssignment
                      ? `${currentAssignment.order.realtor.firstName} ${currentAssignment.order.realtor.lastName}`
                      : '-';

                    return (
                      <TableRow key={qr.id}>
                        <TableCell>
                          <div className="font-medium">{qr.displayId}</div>
                          <div className="text-xs text-gray-500">
                            <a
                              href={`/q/${qr.displayId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-blue-600"
                            >
                              /q/{qr.displayId}
                            </a>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 max-w-[180px] truncate">
                            {propertyAddress}
                          </div>
                        </TableCell>
                        <TableCell>{realtorName}</TableCell>
                        <TableCell>
                          {currentAssignment && (
                            <div className="flex items-center gap-2">
                              <Switch
                                size="sm"
                                checked={currentAssignment.sendWeeklyStats}
                                srLabel="Toggle Weekly Stats"
                                onCheckedChange={(checked) =>
                                  handleToggleWeeklyStats(currentAssignment.id, checked)
                                }
                              />
                              <span className="text-xs text-gray-600">
                                {currentAssignment.sendWeeklyStats ? 'On' : 'Off'}
                              </span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(qr.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleShowStats(qr)}
                              title="Show Stats"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleReassign(qr)}
                              title="Reassign"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDelete(qr.id)}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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

      {selectedQR && showStats && (
        <QRCodeStatsDialog
          qrCodeId={selectedQR.id}
          displayId={selectedQR.displayId}
          onClose={() => {
            setShowStats(false);
            setSelectedQR(null);
          }}
        />
      )}

      {selectedQR && showReassign && (
        <QRCodeReassignDialog
          qrCodeId={selectedQR.id}
          currentOrderId={selectedQR.assignments[0]?.order.id}
          onClose={() => {
            setShowReassign(false);
            setSelectedQR(null);
          }}
          onSuccess={() => {
            setShowReassign(false);
            setSelectedQR(null);
            loadQRCodes();
          }}
        />
      )}
    </div>
  );
}

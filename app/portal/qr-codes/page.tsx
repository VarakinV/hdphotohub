'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PortalNavbar } from '@/components/portal/portal-navbar';
import PortalTwoColumnShell from '@/components/portal/PortalTwoColumnShell';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { QRCodeStatsDialog } from '@/components/qr/QRCodeStatsDialog';
import { QRCodeReassignDialog } from '@/components/qr/QRCodeReassignDialog';
import { Loader2, TrendingUp, Edit, Trash2, X } from 'lucide-react';

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

export default function PortalQRCodesPage() {
  const router = useRouter();
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<{ query?: string }>({});
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [showReassign, setShowReassign] = useState(false);

  async function loadQRCodes() {
    setLoading(true);
    try {
      const res = await fetch('/api/qr/list');
      if (res.ok) {
        setQrCodes(await res.json());
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
      if (filters.query) {
        const currentAssignment = qr.assignments[0];
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
  const [perPage, setPerPage] = useState(10);
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
      <PortalNavbar />
      <Toaster position="bottom-right" />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My QR Codes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage QR codes for your property listings
              </p>
            </div>
          </div>
        </div>
      </header>

      <PortalTwoColumnShell>
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-3 items-center">
          <div className="ml-auto w-full sm:w-64">
            <Input
              placeholder="Search address or QR code..."
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
      </PortalTwoColumnShell>

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

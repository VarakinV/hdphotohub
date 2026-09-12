'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PageHead } from '@/components/admin/ui/page-head';
import { Pager } from '@/components/admin/ui/pager';
import { SearchField } from '@/components/admin/ui/search-field';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { TableShell } from '@/components/admin/ui/table-shell';
import { Toolbar, IconAction, DeleteIconButton } from '@/components/admin/ui/icon-action';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { QRCodeStatsDialog } from '@/components/qr/QRCodeStatsDialog';
import { QRCodeReassignDialog } from '@/components/qr/QRCodeReassignDialog';
import { Loader2, TrendingUp, Edit } from 'lucide-react';

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
    <div className="w-full space-y-6">
      <PageHead title="My QR Codes" subtitle="Manage QR codes for your property listings" />
      <Toaster position="bottom-right" />

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-faint" />
        </div>
      ) : (
        <TableShell
          toolbar={
            <Toolbar className="justify-end">
              <div className="w-full sm:w-64">
                <SearchField
                  value={filters.query || ''}
                  onChange={(v) => setFilters((f) => ({ ...f, query: v }))}
                  placeholder="Search address or QR code…"
                  ariaLabel="Search QR codes"
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
                itemName="QR codes"
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
              icon={TrendingUp}
              title="No QR codes found"
              description="QR codes linked to your property listings will appear here."
            />
          ) : (
            <table className="w-full">
              <thead>
                <tr>
                  <th>Display ID</th>
                  <th>Property</th>
                  <th>Weekly Stats</th>
                  <th>Created</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((qr) => {
                  const currentAssignment = qr.assignments[0];
                  const propertyAddress = currentAssignment
                    ? currentAssignment.order.propertyFormattedAddress || currentAssignment.order.propertyAddress
                    : 'Unassigned';

                  return (
                    <tr
                      key={qr.id}
                      className="border-b border-border last:border-b-0 hover:bg-surface-2"
                    >
                      <td data-label="Display ID" className="td-primary">
                        <div className="font-medium">{qr.displayId}</div>
                        <div className="text-xs text-faint">
                          <a
                            href={`/q/${qr.displayId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-navy-700 hover:underline dark:text-[#9db5f2] dark:hover:text-[#9db5f2]"
                          >
                            /q/{qr.displayId}
                          </a>
                        </div>
                      </td>
                      <td data-label="Property">
                        <div className="max-w-[220px] truncate" title={propertyAddress}>
                          {propertyAddress}
                        </div>
                      </td>
                      <td data-label="Weekly Stats">
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
                            <span className="text-xs text-muted-foreground">
                              {currentAssignment.sendWeeklyStats ? 'On' : 'Off'}
                            </span>
                          </div>
                        )}
                      </td>
                      <td data-label="Created">
                        {new Date(qr.createdAt).toLocaleDateString()}
                      </td>
                      <td data-label="Actions">
                        <div className="flex items-center justify-start gap-1.5 md:justify-end">
                          <IconAction
                            icon={TrendingUp}
                            label="Show Stats"
                            onClick={() => handleShowStats(qr)}
                          />
                          <IconAction
                            icon={Edit}
                            label="Reassign"
                            onClick={() => handleReassign(qr)}
                          />
                          <DeleteIconButton
                            label="Delete QR code"
                            onClick={() => handleDelete(qr.id)}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </TableShell>
      )}

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

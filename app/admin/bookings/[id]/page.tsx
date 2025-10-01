'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function BookingDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    load();
  }, [id]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/bookings/${id}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error('Failed to load booking', e);
    } finally {
      setLoading(false);
    }
  };

  function money(cents: number) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [newStartLocal, setNewStartLocal] = useState<string>('');

  useEffect(() => {
    if (!data?.start) return;
    // initialize datetime-local value from booking.start
    const d = new Date(data.start);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate()
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setNewStartLocal(local);
  }, [data?.start]);

  const handleReschedule = async () => {
    try {
      setSaving(true);
      if (!newStartLocal) return;
      const iso = new Date(newStartLocal).toISOString();
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: iso }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to reschedule');
      toast.success('Booking rescheduled');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to reschedule');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Failed to cancel');
      toast.success('Booking cancelled');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Failed to cancel');
    } finally {
      setSaving(false);
    }
  };

  const handleSyncFromGoogle = async () => {
    try {
      setSyncing(true);
      const res = await fetch(`/api/bookings/${id}/sync-from-google`, {
        method: 'POST',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || 'Sync failed');
      toast.success('Synced from Google');
      await load();
    } catch (e: any) {
      toast.error(e.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <Toaster position="bottom-right" />
      <AdminTwoColumnShell>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : !data ? (
          <div className="text-red-600">Not found</div>
        ) : (
          <div className="grid gap-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-2">Booking</h2>
              <div className="text-sm text-gray-700">Status: {data.status}</div>
              <div className="text-sm text-gray-700">
                When: {new Date(data.start).toLocaleString()} {' '}
                {new Date(data.end).toLocaleString()}
              </div>
              <div className="text-sm text-gray-700">
                Time Zone: {data.timeZone}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                  <Input
                    type="datetime-local"
                    value={newStartLocal}
                    onChange={(e) => setNewStartLocal(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    onClick={handleReschedule}
                    disabled={saving || !newStartLocal}
                  >
                    {saving ? 'Rescheduling…' : 'Reschedule'}
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    {saving ? 'Cancelling…' : 'Cancel Booking'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleSyncFromGoogle}
                    disabled={syncing}
                  >
                    {syncing ? 'Syncing…' : 'Sync from Google'}
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-2">Property</h2>
              <div className="text-sm">
                {data.propertyFormattedAddress || data.propertyAddress}
              </div>
              {data.propertySizeSqFt ? (
                <div className="text-sm text-gray-700">
                  Size: {data.propertySizeSqFt} sq ft
                </div>
              ) : null}
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-2">Contact</h2>
              <div className="text-sm">{data.contactName}</div>
              <div className="text-sm text-gray-700">{data.contactEmail}</div>
              {data.contactPhone ? (
                <div className="text-sm text-gray-700">{data.contactPhone}</div>
              ) : null}
              {data.notes ? (
                <div className="text-sm mt-2">Notes: {data.notes}</div>
              ) : null}
            </Card>

            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-2">Selected Services</h2>
              <div className="text-sm">
                {data.items?.map((it: any) => (
                  <div key={it.id} className="border-b py-2">
                    <div className="flex justify-between">
                      <span className="font-medium">{it.serviceName}</span>
                      <span>
                        {money(it.unitPriceCents)}{' '}
                        {it.taxCents ? (
                          <span className="text-xs text-gray-600">
                            (+{money(it.taxCents)} tax)
                          </span>
                        ) : null}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      {it.service?.category?.name ? (
                        <div>
                          <span className="text-gray-500">
                            Service Category:
                          </span>{' '}
                          {it.service.category.name}
                        </div>
                      ) : null}
                      {it.service?.category?.description ? (
                        <div>
                          <span className="text-gray-500">
                            Service Category Description:
                          </span>{' '}
                          {it.service.category.description}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm flex flex-col items-end gap-1">
                <div className="flex gap-4">
                  <span>Subtotal: {money(data.subtotalCents)}</span>
                  <span>Tax: {money(data.taxCents)}</span>
                </div>
                {data.discountCents > 0 && (
                  <div className="flex gap-4 text-red-600">
                    <span>
                      Discount
                      {data.appliedPromoCode?.code
                        ? ` (${data.appliedPromoCode.code})`
                        : ''}
                      :
                    </span>
                    <span>-{money(data.discountCents)}</span>
                  </div>
                )}
                <div className="font-semibold">
                  Total: {money(data.totalCents)}
                </div>
              </div>
            </Card>
          </div>
        )}
      </AdminTwoColumnShell>
    </div>
  );
}

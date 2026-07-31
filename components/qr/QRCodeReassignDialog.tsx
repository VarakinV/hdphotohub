'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { toast } from 'sonner';

interface QRCodeReassignDialogProps {
  qrCodeId: string;
  currentOrderId: string | undefined;
  onClose: () => void;
  onSuccess: () => void;
}

interface Order {
  id: string;
  propertyAddress: string;
  propertyFormattedAddress?: string | null;
  status: string;
  realtor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  propertyPages: {
    id: string;
    urlPath: string;
  }[];
}

export function QRCodeReassignDialog({
  qrCodeId,
  currentOrderId,
  onClose,
  onSuccess,
}: QRCodeReassignDialogProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [selectedPropertyPageId, setSelectedPropertyPageId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function loadOrders() {
      setLoading(true);
      try {
        const res = await fetch('/api/orders?includeArchived=false');
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const filteredOrders = orders.filter((order) => {
    const address = order.propertyFormattedAddress || order.propertyAddress;
    const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`.toLowerCase();
    const search = searchTerm.toLowerCase();
    return (
      address.toLowerCase().includes(search) ||
      realtorName.includes(search) ||
      order.id.includes(search)
    );
  });

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedOrderId) {
      toast.error('Please select an order');
      return;
    }

    if (selectedOrderId === currentOrderId) {
      toast.error('QR code is already assigned to this order');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/qr/${qrCodeId}/reassign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: selectedOrderId,
          propertyPageId: selectedPropertyPageId || null,
        }),
      });

      if (res.ok) {
        toast.success('QR code reassigned successfully');
        onSuccess();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to reassign QR code');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to reassign QR code');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Reassign QR Code
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="search">Search Orders</Label>
            <Input
              id="search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by address, realtor name, or order ID"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            </div>
          ) : (
            <div className="max-h-60 overflow-y-auto border rounded-lg">
              {filteredOrders.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No orders found</div>
              ) : (
                <div className="divide-y">
                  {filteredOrders.map((order) => {
                    const address = order.propertyFormattedAddress || order.propertyAddress;
                    const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`;
                    const isSelected = selectedOrderId === order.id;
                    const isCurrent = order.id === currentOrderId;

                    return (
                      <button
                        key={order.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(order.id);
                          setSelectedPropertyPageId(order.propertyPages?.[0]?.id || '');
                        }}
                        className={`w-full text-left p-3 hover:bg-gray-50 transition-colors ${
                          isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                        } ${isCurrent ? 'opacity-50' : ''}`}
                      >
                        <div className="font-medium">{address}</div>
                        <div className="text-sm text-gray-600">{realtorName}</div>
                        <div className="text-xs text-gray-500">
                          {order.status}
                          {isCurrent && ' (Current)'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedOrder && selectedOrder.propertyPages && selectedOrder.propertyPages.length > 1 && (
            <div>
              <Label htmlFor="propertyPage">Property Page (Optional)</Label>
              <select
                id="propertyPage"
                value={selectedPropertyPageId}
                onChange={(e) => setSelectedPropertyPageId(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Use default</option>
                {selectedOrder.propertyPages.map((page) => (
                  <option key={page.id} value={page.id}>
                    {page.urlPath}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !selectedOrderId}>
              {submitting ? 'Reassigning...' : 'Reassign'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

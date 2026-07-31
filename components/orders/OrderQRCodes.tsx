'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { QrCode, Plus, TrendingUp, Trash2, FileText, Image, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { QRCodeStatsDialog } from '@/components/qr/QRCodeStatsDialog';

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
    };
  }[];
  printables: {
    id: string;
    variantKey: string;
    status: string;
    pngUrl?: string | null;
    pdfUrl?: string | null;
  }[];
}

interface OrderQRCodesProps {
  orderId: string;
}

export function OrderQRCodes({ orderId }: OrderQRCodesProps) {
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedQR, setSelectedQR] = useState<QRCode | null>(null);
  const [showStats, setShowStats] = useState(false);

  async function loadQRCodes() {
    setLoading(true);
    try {
      const res = await fetch('/api/qr/list');
      if (res.ok) {
        const data = await res.json();
        const orderQRCodes = data.filter((qr: QRCode) =>
          qr.assignments.some((a) => a.order.id === orderId)
        );
        setQrCodes(orderQRCodes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadQRCodes();
  }, [orderId]);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const res = await fetch('/api/qr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId }),
      });

      if (res.ok) {
        const qrCode = await res.json();
        toast.success(`QR code ${qrCode.displayId} created`);

        const printRes = await fetch(`/api/qr/${qrCode.id}/printables`, {
          method: 'POST',
        });

        if (printRes.ok) {
          toast.success('Print artifacts generation started');
        }

        loadQRCodes();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to create QR code');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to create QR code');
    } finally {
      setGenerating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this QR code?')) {
      return;
    }

    try {
      const res = await fetch(`/api/qr/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('QR code deleted');
        loadQRCodes();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete QR code');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to delete QR code');
    }
  }

  function handleShowStats(qr: QRCode) {
    setSelectedQR(qr);
    setShowStats(true);
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">QR Codes for this Order</h3>
          <p className="text-sm text-gray-600">
            Generate QR codes that link to the property lead capture page
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Creating...
            </>
          ) : (
            <>
              <Plus className="h-4 w-4 mr-2" />
              Generate QR Code
            </>
          )}
        </Button>
      </div>

      {qrCodes.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <QrCode className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>No QR codes yet. Generate one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {qrCodes.map((qr) => (
            <div key={qr.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg font-semibold">{qr.displayId}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        qr.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : qr.status === 'UNASSIGNED'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {qr.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    <a
                      href={`/q/${qr.displayId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      /q/{qr.displayId}
                    </a>
                  </div>
                  <div className="text-xs text-gray-500">
                    Created {new Date(qr.createdAt).toLocaleDateString()}
                  </div>

                  {(qr.printables?.length ?? 0) > 0 && (
                    <div className="mt-4">
                      <div className="text-sm font-medium mb-2">Print Artifacts:</div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {qr.printables?.map((p) => {
                          const variantLabel = p.variantKey
                            .split('-')
                            .map((word) => {
                              if (word === 'qr') return 'QR Code';
                              return word.charAt(0).toUpperCase() + word.slice(1);
                            })
                            .join(' ');

                          return (
                            <div
                              key={p.id}
                              className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
                            >
                              {p.status === 'COMPLETE' && p.pngUrl && (
                                <div className="mb-2 flex justify-center">
                                  <img
                                    src={p.pngUrl}
                                    alt={variantLabel}
                                    className="max-w-full h-auto max-h-20 object-contain rounded border border-gray-200"
                                  />
                                </div>
                              )}
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-gray-900 truncate">
                                    {variantLabel}
                                  </div>
                                  <div className="mt-1">
                                    {p.status === 'COMPLETE' ? (
                                      <div className="flex items-center gap-1 text-xs text-green-600">
                                        <CheckCircle className="h-3 w-3" />
                                        <span>Ready</span>
                                      </div>
                                    ) : p.status === 'FAILED' ? (
                                      <div className="flex items-center gap-1 text-xs text-red-600">
                                        <XCircle className="h-3 w-3" />
                                        <span>Failed</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-1 text-xs text-gray-500">
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                        <span>{p.status}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {p.status === 'COMPLETE' && (
                                <div className="flex gap-2 mt-2">
                                  {p.pngUrl && (
                                    <a
                                      href={p.pngUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                      title="Download PNG"
                                    >
                                      <Image className="h-3 w-3" />
                                      <span>PNG</span>
                                    </a>
                                  )}
                                  {p.pdfUrl && (
                                    <a
                                      href={p.pdfUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                                      title="Download PDF"
                                    >
                                      <FileText className="h-3 w-3" />
                                      <span>PDF</span>
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
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
                    onClick={() => handleDelete(qr.id)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
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
    </div>
  );
}

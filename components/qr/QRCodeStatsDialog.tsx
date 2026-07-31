'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface QRCodeStatsDialogProps {
  qrCodeId: string;
  displayId: string;
  onClose: () => void;
}

interface AssignmentStats {
  id: string;
  assignedAt: string;
  unassignedAt: string | null;
  sendWeeklyStats: boolean;
  order: {
    id: string;
    propertyAddress: string;
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
  totalScans: number;
  totalLeads: number;
  recentScans: number;
  recentLeads: number;
  scans: {
    id: string;
    scannedAt: string;
    userAgent: string | null;
  }[];
  leads: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    createdAt: string;
  }[];
}

interface StatsData {
  qrCode: {
    id: string;
    displayId: string;
    status: string;
    createdAt: string;
  };
  assignments: AssignmentStats[];
}

export function QRCodeStatsDialog({ qrCodeId, displayId, onClose }: QRCodeStatsDialogProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState<AssignmentStats | null>(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/qr/${qrCodeId}/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
          if (data.assignments.length > 0) {
            setSelectedAssignment(data.assignments[0]);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [qrCodeId]);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            QR Code Stats: {displayId}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          </div>
        ) : !stats ? (
          <div className="p-8 text-center text-gray-500">Failed to load stats</div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Status</div>
                <div className="text-lg font-semibold">{stats.qrCode.status}</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600">Created</div>
                <div className="text-lg font-semibold">
                  {new Date(stats.qrCode.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">Assignment History</h3>
              <div className="space-y-2">
                {stats.assignments.map((assignment) => (
                  <button
                    key={assignment.id}
                    onClick={() => setSelectedAssignment(assignment)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedAssignment?.id === assignment.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium">{assignment.order.propertyAddress}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(assignment.assignedAt).toLocaleDateString()} -{' '}
                      {assignment.unassignedAt
                        ? new Date(assignment.unassignedAt).toLocaleDateString()
                        : 'Present'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {assignment.order.realtor.firstName} {assignment.order.realtor.lastName}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {selectedAssignment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-blue-600">Total Scans</div>
                    <div className="text-2xl font-bold text-blue-900">
                      {selectedAssignment.totalScans}
                    </div>
                    <div className="text-xs text-blue-600">
                      Last 7 days: {selectedAssignment.recentScans}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-sm text-green-600">Total Leads</div>
                    <div className="text-2xl font-bold text-green-900">
                      {selectedAssignment.totalLeads}
                    </div>
                    <div className="text-xs text-green-600">
                      Last 7 days: {selectedAssignment.recentLeads}
                    </div>
                  </div>
                </div>

                {selectedAssignment.leads.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Leads</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {selectedAssignment.leads.map((lead) => (
                        <div key={lead.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="font-medium">{lead.name}</div>
                          <div className="text-sm text-gray-600">
                            {lead.email}
                            {lead.phone && ` • ${lead.phone}`}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(lead.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedAssignment.scans.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Recent Scans</h4>
                    <div className="space-y-1 max-h-40 overflow-y-auto text-sm">
                      {selectedAssignment.scans.slice(0, 20).map((scan) => (
                        <div key={scan.id} className="text-gray-600">
                          {new Date(scan.scannedAt).toLocaleString()}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

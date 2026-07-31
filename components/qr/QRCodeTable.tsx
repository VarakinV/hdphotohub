'use client';

import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, Edit, Trash2 } from 'lucide-react';

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

interface QRCodeTableProps {
  qrCodes: QRCode[];
  onShowStats: (qr: QRCode) => void;
  onReassign: (qr: QRCode) => void;
  onDelete: (id: string) => void;
  onToggleWeeklyStats: (id: string, enabled: boolean) => void;
  onRefresh: () => void;
  isRealtor?: boolean;
}

export function QRCodeTable({
  qrCodes,
  onShowStats,
  onReassign,
  onDelete,
  onToggleWeeklyStats,
  onRefresh,
  isRealtor = false,
}: QRCodeTableProps) {
  if (qrCodes.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        No QR codes yet. Create one from an order details page.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
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
          {qrCodes.map((qr) => {
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
                          onToggleWeeklyStats(currentAssignment.id, checked)
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
                      onClick={() => onShowStats(qr)}
                      title="Show Stats"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onReassign(qr)}
                      title="Reassign"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => onDelete(qr.id)}
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
    </div>
  );
}

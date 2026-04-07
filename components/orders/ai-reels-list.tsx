'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, Trash2, ExternalLink, CheckCircle2, XCircle, Clock, Cog } from 'lucide-react';
import { toast } from 'sonner';

interface AiReel {
  id: string;
  orderId: string;
  sourceImageUrl: string;
  kieImageStatus: string;
  twilightImageUrl?: string;
  kieVideoStatus: string;
  videoUrl?: string;
  j2vStatus: string;
  finalUrl?: string;
  thumbnail?: string;
  width?: number;
  height?: number;
  error?: string;
  createdAt: string;
}

interface AiReelsListProps {
  orderId: string;
  refreshToken?: number;
  onDeleted?: () => void;
}

function StepIcon({ status }: { status: string }) {
  switch (status) {
    case 'COMPLETE': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'PROCESSING': return <Cog className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Clock className="h-4 w-4 text-gray-400" />;
  }
}

function StepLabel({ label, status }: { label: string; status: string }) {
  const colorClass =
    status === 'COMPLETE' ? 'text-green-700' :
    status === 'PROCESSING' ? 'text-blue-700' :
    status === 'FAILED' ? 'text-red-700' : 'text-gray-500';

  return (
    <div className="flex items-center gap-1.5">
      <StepIcon status={status} />
      <span className={`text-xs font-medium ${colorClass}`}>{label}</span>
    </div>
  );
}

export default function AiReelsList({ orderId, refreshToken = 0, onDeleted }: AiReelsListProps) {
  const [reels, setReels] = useState<AiReel[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchReels = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/ai-reels`);
      if (res.ok) {
        const data = await res.json();
        setReels(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [orderId]);

  useEffect(() => { fetchReels(); }, [fetchReels, refreshToken]);

  // Auto-refresh while any reel is in progress
  useEffect(() => {
    const hasInProgress = reels.some(
      (r) => r.kieImageStatus === 'PROCESSING' || r.kieVideoStatus === 'PROCESSING' || r.j2vStatus === 'PROCESSING'
    );
    if (!hasInProgress) return;
    const interval = setInterval(fetchReels, 10000);
    return () => clearInterval(interval);
  }, [reels, fetchReels]);

  async function handleDelete(reelId: string) {
    if (!confirm('Delete this AI reel?')) return;
    setDeleting(reelId);
    try {
      const res = await fetch(`/api/orders/${orderId}/ai-reels/${reelId}`, { method: 'DELETE' });
      if (res.ok) {
        setReels((prev) => prev.filter((r) => r.id !== reelId));
        toast.success('AI reel deleted');
        onDeleted?.();
      } else {
        toast.error('Failed to delete');
      }
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!reels.length) {
    return <div className="text-sm text-gray-500 py-4">No AI reels generated yet.</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-gray-700">AI Reels</h3>
      {reels.map((r) => (
        <div key={r.id} className="border rounded-lg p-4 space-y-3">
          {/* Pipeline steps */}
          <div className="flex flex-wrap gap-4">
            <StepLabel label="Twilight Image" status={r.kieImageStatus} />
            <span className="text-gray-300">→</span>
            <StepLabel label="Transition Video" status={r.kieVideoStatus} />
            <span className="text-gray-300">→</span>
            <StepLabel label="Final Reel" status={r.j2vStatus} />
          </div>

          {/* Error */}
          {r.error && (
            <div className="text-xs text-red-600 bg-red-50 rounded p-2">{r.error}</div>
          )}

          {/* Source image thumbnail */}
          <div className="flex items-start gap-4">
            {r.sourceImageUrl && (
              <div className="flex-shrink-0">
                <img src={r.sourceImageUrl} alt="Source" className="w-20 h-14 object-cover rounded border" />
              </div>
            )}
            {r.twilightImageUrl && (
              <div className="flex-shrink-0">
                <img src={r.twilightImageUrl} alt="Twilight" className="w-20 h-14 object-cover rounded border" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-gray-500">
                Created {new Date(r.createdAt).toLocaleString()}
              </div>
              {r.width && r.height && (
                <div className="text-xs text-gray-500">{r.width}×{r.height}</div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {r.finalUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={r.finalUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View Reel
                </a>
              </Button>
            )}
            <Button
              variant="ghost" size="sm"
              onClick={() => handleDelete(r.id)}
              disabled={deleting === r.id}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              {deleting === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

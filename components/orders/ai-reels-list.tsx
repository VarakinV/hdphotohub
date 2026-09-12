'use client';

import { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, CheckCircle2, XCircle, Clock, Cog, RotateCcw } from 'lucide-react';
import { DeleteIconButton } from '@/components/admin/ui/icon-action';
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
    case 'COMPLETE': return <CheckCircle2 className="h-4 w-4 text-[#1c7a41] dark:text-[#7fe0a3]" />;
    case 'PROCESSING': return <Cog className="h-4 w-4 text-blue-500 animate-spin" />;
    case 'FAILED': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <Clock className="h-4 w-4 text-faint" />;
  }
}

function StepLabel({ label, status }: { label: string; status: string }) {
  const colorClass =
    status === 'COMPLETE' ? 'text-[#1c7a41] dark:text-[#7fe0a3]' :
    status === 'PROCESSING' ? 'text-navy-700 dark:text-[#9db5f2]' :
    status === 'FAILED' ? 'text-[#c23434] dark:text-[#f09a9a]' : 'text-muted-foreground';

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
  const [retrying, setRetrying] = useState<string | null>(null);

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

  async function handleRetry(reelId: string) {
    setRetrying(reelId);
    try {
      const res = await fetch(`/api/orders/${orderId}/ai-reels/${reelId}/retry`, { method: 'POST' });
      if (res.ok) {
        toast.success('Retrying failed step...');
        fetchReels();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || err.error || 'Retry failed');
      }
    } catch {
      toast.error('Retry failed');
    } finally {
      setRetrying(null);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-6 w-6 animate-spin text-faint" />
      </div>
    );
  }

  if (!reels.length) {
    return <div className="text-sm text-muted-foreground py-4">No AI reels generated yet.</div>;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">AI Reels</h3>
      {reels.map((r) => (
        <div key={r.id} className="border rounded-lg p-4 space-y-3">
          {/* Pipeline steps */}
          <div className="flex flex-wrap gap-4">
            <StepLabel label="Twilight Image" status={r.kieImageStatus} />
            <span className="text-faint">→</span>
            <StepLabel label="Transition Video" status={r.kieVideoStatus} />
            <span className="text-faint">→</span>
            <StepLabel label="Final Reel" status={r.j2vStatus} />
          </div>

          {/* Error */}
          {r.error && (
            <div className="text-xs text-[#c23434] dark:text-[#f09a9a] bg-[#fbe9e9] dark:bg-[#351a1c] rounded p-2">{r.error}</div>
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
              <div className="text-xs text-muted-foreground">
                Created {new Date(r.createdAt).toLocaleString()}
              </div>
              {r.width && r.height && (
                <div className="text-xs text-muted-foreground">{r.width}×{r.height}</div>
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
            {(r.kieImageStatus === 'FAILED' || r.kieVideoStatus === 'FAILED' || r.j2vStatus === 'FAILED') && (
              <Button
                variant="outline" size="sm"
                onClick={() => handleRetry(r.id)}
                disabled={retrying === r.id}
                className="text-navy-700 dark:text-[#9db5f2] hover:text-navy-700 dark:text-[#9db5f2] hover:bg-[#eaf0fb] dark:bg-[#182852]"
              >
                {retrying === r.id ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : <RotateCcw className="h-3.5 w-3.5 mr-1.5" />}
                Retry
              </Button>
            )}
            <DeleteIconButton
              label="Delete"
              onClick={() => handleDelete(r.id)}
              loading={deleting === r.id}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

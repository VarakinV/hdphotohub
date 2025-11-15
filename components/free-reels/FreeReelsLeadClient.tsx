'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PromoSlides } from '@/components/free-reels/PromoSlides';
import { ProgressBar } from '@/components/free-reels/ProgressBar';
import { ReelPreviewCard } from '@/components/free-reels/ReelPreviewCard';

async function fetchLead(id: string) {
  const res = await fetch(`/api/free-reels/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Not found');
  const data = await res.json();
  return data.lead as any;
}

function sortReels(reels: any[]) {
  const order = ['v1-9x16', 'v3-9x16', 'v4-9x16'];
  const idx = (k: string) => {
    const i = order.indexOf((k || '').toLowerCase());
    return i >= 0 ? i : 999;
  };
  return reels
    .slice()
    .sort((a: any, b: any) => idx(a.variantKey) - idx(b.variantKey));
}

export function FreeReelsLeadClient({ id }: { id: string }) {
  const [lead, setLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const firedRef = useRef(false);
  const [displayPct, setDisplayPct] = useState(0);

  const completeReels = useMemo(
    () => (lead?.reels || []).filter((r: any) => r.status === 'COMPLETE'),
    [lead]
  );
  const isComplete = lead?.status === 'COMPLETE' || completeReels.length >= 3;

  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setInterval> | undefined;
    async function loadOnce() {
      try {
        const l = await fetchLead(id);
        if (!alive) return;
        setLead(l);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    }
    loadOnce();
    if (!isComplete) {
      t = setInterval(loadOnce, 5000);
    }
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
  }, [id, isComplete]);

  // Smooth, continuous progress between real updates
  useEffect(() => {
    const stepWidth = 100 / 3;
    const base = (completeReels.length / 3) * 100;

    // If complete, snap to 100% and stop running an interval
    if (isComplete) {
      setDisplayPct(100);
      return;
    }

    const hasInProgress = (lead?.reels || []).some(
      (r: any) => r.status === 'RENDERING' || r.status === 'QUEUED'
    );
    const target = Math.min(99, base + (hasInProgress ? stepWidth * 0.85 : 0));

    const iv = setInterval(() => {
      setDisplayPct((prev) => {
        // Never go below the known base percent
        const anchor = base;
        const dir = target - prev;
        if (Math.abs(dir) < 0.5) return Math.max(anchor, target);
        // Move toward target smoothly
        const delta = dir > 0 ? Math.min(dir, 0.8) : Math.max(dir, -2);
        const next = Math.max(anchor, prev + delta);
        return next;
      });
    }, 200);
    return () => clearInterval(iv);
  }, [completeReels.length, isComplete, lead?.reels]);

  useEffect(() => {
    if (isComplete && !firedRef.current) {
      firedRef.current = true;
      import('canvas-confetti')
        .then((mod) => {
          const confetti = mod.default;
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        })
        .catch(() => {});
    }
  }, [isComplete]);

  if (loading && !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  return (
    <>
      {!isComplete ? (
        <>
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-semibold">
              Generating your reels…
            </h1>
            <p className="text-gray-600">
              Hang tight while we render your reels. This usually takes 1–3
              minutes.
            </p>
            <div className="flex items-center gap-3">
              <ProgressBar value={Math.round(displayPct)} max={100} />
              <div className="text-sm text-gray-600 w-16 text-right">
                {Math.round(displayPct)}%
              </div>
            </div>
            <div className="text-xs text-gray-500">
              We'll refresh this page automatically.
            </div>
            <PromoSlides />
          </div>

          {/* 3 placeholders for reels (9x16) */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="aspect-[9/16] rounded-md reel-skel" />
            <div className="aspect-[9/16] rounded-md reel-skel" />
            <div className="aspect-[9/16] rounded-md reel-skel" />
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold">
            🎉 Your Reels Are Ready!
          </h1>
          <p className="text-gray-700">
            Download your reels below. Share them on Instagram, Facebook, and
            TikTok.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sortReels(lead?.reels || [])
              .filter((r: any) => r.status === 'COMPLETE')
              .map((r: any) => (
                <ReelPreviewCard key={r.id} reel={r} />
              ))}
          </div>
          <div className="pt-2">
            <Button
              asChild
              variant="secondary"
              className="w-full h-12 md:h-14 text-base md:text-lg bg-[#ca4153] hover:bg-[#b13a49] text-white cursor-pointer"
            >
              <Link
                href="https://photos4realestate.ca/book-online/"
                target="_blank"
              >
                Book a Photoshoot
              </Link>
            </Button>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes reelShimmer {
          0% {
            background-position: 0% 50%;
            box-shadow: 0 0 0 0 rgba(202, 65, 83, 0.15);
          }
          50% {
            background-position: 100% 50%;
            box-shadow: 0 0 30px 6px rgba(202, 65, 83, 0.1);
          }
          100% {
            background-position: 0% 50%;
            box-shadow: 0 0 0 0 rgba(202, 65, 83, 0.15);
          }
        }
        .reel-skel {
          background: linear-gradient(
            90deg,
            #f1f5f9 0%,
            #e5e7eb 50%,
            #f1f5f9 100%
          );
          background-size: 200% 100%;
          animation: reelShimmer 1.8s ease-in-out infinite;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </>
  );
}

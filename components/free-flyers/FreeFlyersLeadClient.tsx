'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PromoSlides } from '@/components/free-reels/PromoSlides';
import { ProgressBar } from '@/components/free-reels/ProgressBar';
import { FlyerPreviewCard } from '@/components/free-flyers/FlyerPreviewCard';

async function fetchLead(id: string) {
  const res = await fetch(`/api/free-flyers/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Not found');
  const data = await res.json();
  return data.lead as any;
}

function sortFlyers(flyers: any[]) {
  const order = ['f1', 'f2', 'f3'];
  const idx = (k: string) => {
    const i = order.indexOf((k || '').toLowerCase());
    return i >= 0 ? i : 999;
  };
  return flyers
    .slice()
    .sort((a: any, b: any) => idx(a.variantKey) - idx(b.variantKey));
}

export function FreeFlyersLeadClient({ id }: { id: string }) {
  const [lead, setLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const firedRef = useRef(false);
  const [displayPct, setDisplayPct] = useState(0);
  const [startTs] = useState(() => Date.now());
  const minMs = 10000; // show promo at least once
  const startedRef = useRef(false);
  const initialCompleteRef = useRef(false);

  const completeFlyers = useMemo(
    () => (lead?.flyers || []).filter((r: any) => r.status === 'COMPLETE'),
    [lead]
  );
  const isComplete = lead?.status === 'COMPLETE' || completeFlyers.length >= 3;
  const isCompleteUi =
    isComplete &&
    (initialCompleteRef.current ? true : Date.now() - startTs >= minMs);

  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setInterval> | undefined;
    async function loadOnce() {
      try {
        const l = await fetchLead(id);
        if (!alive) return;
        // if first load sees already complete, skip min duration gate
        if (!initialCompleteRef.current) {
          const completeNow =
            l?.status === 'COMPLETE' ||
            (l?.flyers || []).filter((f: any) => f.status === 'COMPLETE')
              .length >= 3;
          if (completeNow) initialCompleteRef.current = true;
        }
        setLead(l);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    loadOnce();
    if (!isComplete) t = setInterval(loadOnce, 5000);
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
  }, [id, isComplete]);

  // Kick off server-side rendering as soon as we land on the status page
  useEffect(() => {
    if (!lead || startedRef.current) return;
    const order = ['f1', 'f2', 'f3'];
    const flyers = (lead.flyers || []).map((f: any) => ({
      key: (f.variantKey || '').toLowerCase(),
      status: f.status,
      url: f.url,
    })) as Array<{ key: string; status: string; url?: string | null }>;
    const pendingVariants = order.filter((key) => {
      const row = flyers.find((f) => f.key === key);
      // Start if:
      // - missing row
      // - FAILED
      // - QUEUED
      // - RENDERING but no url yet (stuck placeholder)
      if (!row) return true;
      if (row.status === 'FAILED') return true;
      if (row.status === 'QUEUED') return true;
      if (row.status === 'RENDERING' && !row.url) return true;
      return false;
    });
    if (pendingVariants.length) {
      startedRef.current = true;
      // fire one per variant, staggered by ~1s to smooth serverless load
      (async () => {
        const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
        for (let i = 0; i < pendingVariants.length; i++) {
          const v = pendingVariants[i];
          try {
            await fetch(`/api/free-flyers/${id}/start?variant=${v}`, {
              method: 'POST',
            });
          } catch {}
          if (i < pendingVariants.length - 1) {
            await sleep(1000);
          }
        }
      })();
    }
  }, [lead, id]);

  // Smooth progress and respect min duration
  useEffect(() => {
    const base = (completeFlyers.length / 3) * 100;
    const target = isComplete ? 99 : Math.min(99, base + 25);
    const iv = setInterval(() => {
      setDisplayPct((prev) => {
        const anchor = base;
        const dir = (isCompleteUi ? 100 : target) - prev;
        if (Math.abs(dir) < 0.5)
          return Math.max(anchor, isCompleteUi ? 100 : target);
        const delta = dir > 0 ? Math.min(dir, 1.2) : Math.max(dir, -2);
        const next = Math.max(anchor, prev + delta);
        return next;
      });
    }, 200);
    return () => clearInterval(iv);
  }, [completeFlyers.length, isComplete, isCompleteUi]);

  useEffect(() => {
    if (isCompleteUi && !firedRef.current) {
      firedRef.current = true;
      import('canvas-confetti')
        .then((mod) =>
          mod.default({ particleCount: 150, spread: 80, origin: { y: 0.6 } })
        )
        .catch(() => {});
    }
  }, [isCompleteUi]);

  if (loading && !lead) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600">
        Loading…
      </div>
    );
  }

  return (
    <>
      {!isCompleteUi ? (
        <>
          <div className="space-y-4">
            <h1 className="text-2xl md:text-3xl font-semibold">
              Generating your flyers…
            </h1>
            <p className="text-gray-600">
              Hang tight while we render your flyers. This usually takes about
              10–20 seconds.
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
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="aspect-[8.5/11] rounded-md reel-skel" />
            <div className="aspect-[8.5/11] rounded-md reel-skel" />
            <div className="aspect-[8.5/11] rounded-md reel-skel" />
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold">
            🎉 Your Flyers Are Ready!
          </h1>
          <p className="text-gray-700">
            Download your flyers below. Share the PDF or print it.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {sortFlyers(lead?.flyers || [])
              .filter((f: any) => f.status === 'COMPLETE')
              .map((f: any) => (
                <FlyerPreviewCard key={f.id} flyer={f} />
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
        @keyframes skelShimmer {
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
          animation: skelShimmer 1.8s ease-in-out infinite;
          border: 1px solid rgba(0, 0, 0, 0.06);
        }
      `}</style>
    </>
  );
}

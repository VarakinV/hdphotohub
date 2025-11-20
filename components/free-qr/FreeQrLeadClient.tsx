'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PromoSlides } from '@/components/free-reels/PromoSlides';
import { ProgressBar } from '@/components/free-reels/ProgressBar';
import { QrDownloadCard } from '@/components/free-qr/QrDownloadCard';

async function fetchLead(id: string) {
  const res = await fetch(`/api/free-qr/${id}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Not found');
  const data = await res.json();
  return data.lead as any;
}

export function FreeQrLeadClient({ id }: { id: string }) {
  const [lead, setLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayPct, setDisplayPct] = useState(0);
  const firedRef = useRef(false);
  const [startTs] = useState(() => Date.now());
  const minMs = 8000; // quick, but show promo at least once
  const initialCompleteRef = useRef(false);

  const completeQrs = useMemo(
    () => (lead?.qrCodes || []).filter((r: any) => r.status === 'COMPLETE'),
    [lead]
  );
  // Determine how many variants we expect by counting distinct variant keys (fallback to 3)
  const expectedCount = useMemo(() => {
    const arr = Array.isArray(lead?.qrCodes) ? lead!.qrCodes : [];
    const keys = new Set(arr.map((r: any) => String(r.variantKey || '')));
    return Math.max(3, keys.size || 0);
  }, [lead]);

  const isComplete =
    lead?.status === 'COMPLETE' || completeQrs.length >= expectedCount;
  const isCompleteUi =
    isComplete &&
    (initialCompleteRef.current ? true : Date.now() - startTs >= minMs);

  const readyQrs = useMemo(() => {
    const arr = (lead?.qrCodes || [])
      .filter((q: any) => q.status === 'COMPLETE')
      .sort((a: any, b: any) =>
        a?.variantKey === 'custom' && b?.variantKey !== 'custom'
          ? -1
          : b?.variantKey === 'custom' && a?.variantKey !== 'custom'
          ? 1
          : 0
      );
    return arr;
  }, [lead]);

  const lgCols =
    readyQrs.length >= 4
      ? 'lg:grid-cols-4'
      : readyQrs.length === 3
      ? 'lg:grid-cols-3'
      : readyQrs.length === 2
      ? 'lg:grid-cols-2'
      : 'lg:grid-cols-1';

  useEffect(() => {
    let alive = true;
    let t: ReturnType<typeof setInterval> | undefined;
    async function loadOnce() {
      try {
        const l = await fetchLead(id);
        if (!alive) return;
        if (!initialCompleteRef.current) {
          const all = Array.isArray(l?.qrCodes) ? l.qrCodes : [];
          const distinct = new Set(
            all.map((f: any) => String(f.variantKey || ''))
          );
          const expected = Math.max(3, distinct.size || 0);
          const completeCount = all.filter(
            (f: any) => f.status === 'COMPLETE'
          ).length;
          const completeNow =
            l?.status === 'COMPLETE' || completeCount >= expected;
          if (completeNow) initialCompleteRef.current = true;
        }
        setLead(l);
        setLoading(false);
      } catch {
        setLoading(false);
      }
    }
    loadOnce();
    if (!isComplete) t = setInterval(loadOnce, 3000);
    return () => {
      alive = false;
      if (t) clearInterval(t);
    };
  }, [id, isComplete]);

  // Smooth progress and respect min duration
  useEffect(() => {
    const base = (completeQrs.length / expectedCount) * 100;
    const target = isComplete ? 99 : Math.min(99, base + 25);
    const iv = setInterval(() => {
      setDisplayPct((prev) => {
        const anchor = base;
        const dir = (isCompleteUi ? 100 : target) - prev;
        if (Math.abs(dir) < 0.5)
          return Math.max(anchor, isCompleteUi ? 100 : target);
        const delta = dir > 0 ? Math.min(dir, 1.8) : Math.max(dir, -2);
        const next = Math.max(anchor, prev + delta);
        return next;
      });
    }, 200);
    return () => clearInterval(iv);
  }, [completeQrs.length, isComplete, isCompleteUi, expectedCount]);

  useEffect(() => {
    if (isCompleteUi && !firedRef.current) {
      firedRef.current = true;
      import('canvas-confetti')
        .then((mod) =>
          mod.default({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
        )
        .catch(() => {});
    }
  }, [isCompleteUi]);

  if (loading && !lead) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center text-gray-600">
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
              Generating your QR codes…
            </h1>
            <p className="text-gray-600">
              Hang tight; this only takes a few seconds.
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
            <div className="aspect-square rounded-md reel-skel" />
            <div className="aspect-square rounded-md reel-skel" />
            <div className="aspect-square rounded-md reel-skel" />
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold">
            🎉 Your QR Codes Are Ready!
          </h1>
          <p className="text-gray-700">
            Download your QR codes below. Use them on flyers, social, and your
            website.
          </p>
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 ${
              readyQrs.length >= 3 ? 'md:grid-cols-3' : ''
            } ${lgCols} gap-3 justify-center justify-items-center`}
          >
            {readyQrs.map((q: any) => (
              <QrDownloadCard key={q.id} qr={q} />
            ))}
          </div>
          <div className="pt-2">
            <Button
              asChild
              variant="secondary"
              className="w-full h-12 md:h-14 text-base md:text-lg bg-[#ca4153] hover:bg-[#b13a49] text-white cursor-pointer"
            >
              <a
                href="https://photos4realestate.ca/book-online/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Book a Photoshoot
              </a>
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

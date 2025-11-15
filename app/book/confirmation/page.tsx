'use client';

import React, { Suspense, useEffect, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';

function formatDateLongWithComma(d: Date) {
  const month = d.toLocaleString('en-US', { month: 'long' });
  const day = d.getDate();
  const year = d.getFullYear();
  return `${month}, ${day}, ${year}`;
}

function ConfettiBurst() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const ctxEl = ctx as CanvasRenderingContext2D;
    const canvasEl = canvas as HTMLCanvasElement;
    let raf = 0;

    function resize() {
      const c = canvasRef.current;
      if (!c) return;
      c.width = window.innerWidth;
      c.height = window.innerHeight;
    }
    resize();

    const colors = ['#ca4153', '#00C2FF', '#FFD166', '#06D6A0', '#EF476F'];
    type P = {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      ttl: number;
      color: string;
      rot: number;
      vr: number;
    };
    const parts: P[] = [];

    function spawnBurst(x: number, y: number, count = 120) {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI - Math.PI / 2; // upward fan
        const speed = 6 + Math.random() * 6;
        parts.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 2,
          size: 6 + Math.random() * 6,
          life: 0,
          ttl: 120 + Math.random() * 40,
          color: colors[(Math.random() * colors.length) | 0],
          rot: Math.random() * Math.PI,
          vr: (Math.random() - 0.5) * 0.2,
        });
      }
    }

    // Two quick bursts from left/right, then a sprinkle
    const midY = canvasEl.height * 0.25;
    spawnBurst(canvasEl.width * 0.15, midY, 140);
    spawnBurst(canvasEl.width * 0.85, midY, 140);
    const sprinkle = setInterval(
      () =>
        spawnBurst(
          canvasEl.width * Math.random(),
          canvasEl.height * 0.1 + Math.random() * 80,
          40
        ),
      450
    );
    const stopAt = performance.now() + 2500; // spawn ~2.5s

    function tick(t: number) {
      if (t > stopAt) {
        clearInterval(sprinkle);
      }
      ctxEl.clearRect(0, 0, canvasEl.width, canvasEl.height);
      // physics
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.life++;
        if (p.life > p.ttl) {
          parts.splice(i, 1);
          continue;
        }
        p.vy += 0.12; // gravity
        p.vx *= 0.995; // air drag

        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        // draw
        ctxEl.save();
        ctxEl.translate(p.x, p.y);
        ctxEl.rotate(p.rot);
        ctxEl.fillStyle = p.color;
        ctxEl.globalAlpha = Math.max(0, 1 - p.life / p.ttl);
        ctxEl.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctxEl.restore();
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      clearInterval(sprinkle);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[60]"
      aria-hidden="true"
    />
  );
}

function formatTime12h(d: Date, tz?: string) {
  const opts: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: tz,
  };
  return new Intl.DateTimeFormat('en-US', opts)
    .format(d)
    .replace('AM', 'a.m.')
    .replace('PM', 'p.m.');
}

export default function BookingConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          Loading...
        </div>
      }
    >
      <BookingConfirmationInner />
    </Suspense>
  );
}

function BookingConfirmationInner() {
  const params = useSearchParams();
  const startISO = params.get('start') || '';
  const tz = params.get('tz') || undefined;
  const address = params.get('address') || '';

  const dateObj = startISO ? new Date(startISO) : null;
  const dateText = dateObj ? formatDateLongWithComma(dateObj) : '';
  const timeText = dateObj ? formatTime12h(dateObj, tz) : '';

  return (
    <>
      {/* Header (replicated from /book page) */}
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a
            href="https://photos4realestate.ca/"
            className="flex items-center gap-3"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8">
                <Image
                  src="/Map-Pin-Logo.svg"
                  alt="Photos4RealEstate logo"
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <div className="leading-tight select-none">
                <div className="font-semibold text-[#cb4153]">
                  Photos 4 Real Estate
                </div>
                <div className="text-xs text-gray-500">
                  Elevate Your Real Estate Listings
                </div>
              </div>
            </div>
          </a>
          <a
            href="https://photos4realestate.ca/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
          >
            Home
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Card className="p-6 bg-[#d5f7dc]">
          <ConfettiBurst />

          <h1 className="text-2xl font-bold mb-2">Booking Confirmed!</h1>
          <p className="text-sm text-muted-foreground mb-4">
            We&apos;ve received your booking request. A confirmation email has
            been sent.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Date</div>
              <div className="font-medium">{dateText || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Time slot</div>
              <div className="font-medium">{timeText || '—'}</div>
            </div>
            <div className="sm:col-span-2">
              <div className="text-muted-foreground">Property Address</div>
              <div className="font-medium">{address || '—'}</div>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-0 shadow-none bg-white">
          <h2 className="text-xl font-semibold mb-2">
            Prepare Your Property for a Successful Photoshoot
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            To ensure your photoshoot goes smoothly and your property looks its
            absolute best, we recommend following our Photoshoot Checklist. This
            checklist includes essential steps that homeowners and realtors
            should take to prepare the property. Proper preparation can make a
            significant difference in the quality of the photos and the overall
            appeal of your listing.
          </p>
          <a
            href="https://photos4realestate.ca/photoshoot-checklist/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center h-9 rounded-md px-4 text-sm font-medium text-white"
            style={{ backgroundColor: '#ca4153' }}
            onMouseOver={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                '#b42f40')
            }
            onMouseOut={(e) =>
              ((e.currentTarget as HTMLAnchorElement).style.backgroundColor =
                '#ca4153')
            }
          >
            Checklist
          </a>
        </Card>
      </main>

      {/* Footer (replicated from /book page) */}
      <footer className="mt-8 border-t border-white/10 bg-[#131c3b] text-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-sm">
          <div>
            Powered by{' '}
            <a
              href="https://photos4realestate.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Photos 4 Real Estate
            </a>{' '}
            · © {new Date().getFullYear()} All Rights Reserved
          </div>
          <div className="mt-2 space-x-4">
            <a
              href="https://photos4realestate.ca/terms-and-conditions/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Terms
            </a>
            <a
              href="https://photos4realestate.ca/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Privacy
            </a>
            <a
              href="https://photos4realestate.ca/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Contacts
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}

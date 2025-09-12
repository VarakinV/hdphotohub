'use client';

import { useEffect, useRef } from 'react';

export function HeroParticles() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas sizing with HiDPI support
    const resize = () => {
      const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
    };
    resize();
    window.addEventListener('resize', resize);

    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // Particle configuration mimicking particles.js "nasa" preset
    type P = { x: number; y: number; vx: number; vy: number; r: number };
    const particles: P[] = [];
    const spawn = () => {
      const area = canvas.offsetWidth * canvas.offsetHeight;
      const target = Math.max(80, Math.min(160, Math.floor(area / 9500)));
      particles.length = 0;
      for (let i = 0; i < target; i++) {
        particles.push({
          x: Math.random() * canvas.offsetWidth,
          y: Math.random() * canvas.offsetHeight,
          vx: (Math.random() - 0.5) * (prefersReduced ? 0.05 : 0.3),
          vy: (Math.random() - 0.5) * (prefersReduced ? 0.05 : 0.3),
          r: 0.8 + Math.random() * 1.6,
        });
      }
    };
    spawn();

    const mouse = { x: -9999, y: -9999, active: false };
    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      mouse.x = x;
      mouse.y = y;
      mouse.active = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
    };
    const onLeave = () => {
      mouse.active = false;
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseout', onLeave);

    let lastW = canvas.offsetWidth,
      lastH = canvas.offsetHeight;
    const draw = () => {
      // Re-spawn on size change to keep density
      if (canvas.offsetWidth !== lastW || canvas.offsetHeight !== lastH) {
        lastW = canvas.offsetWidth;
        lastH = canvas.offsetHeight;
        resize();
        spawn();
      }

      // Background (hero color)
      ctx.fillStyle = '#131c3b';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      // Update positions
      for (const p of particles) {
        if (!prefersReduced) {
          p.x += p.vx;
          p.y += p.vy;
        }
        // wrap around
        if (p.x < -5) p.x = canvas.offsetWidth + 5;
        if (p.x > canvas.offsetWidth + 5) p.x = -5;
        if (p.y < -5) p.y = canvas.offsetHeight + 5;
        if (p.y > canvas.offsetHeight + 5) p.y = -5;
      }

      // Draw links between nearby particles
      const maxDist = 120;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x,
            dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < maxDist * maxDist) {
            const a = 0.25 * (1 - Math.sqrt(d2) / maxDist);
            ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      ctx.fillStyle = '#ffffff';
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mouse grab effect: draw lines from nearby particles to cursor
      if (mouse.active) {
        const grabDist = 140;
        for (const p of particles) {
          const dx = p.x - mouse.x,
            dy = p.y - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < grabDist * grabDist) {
            const a = 0.35 * (1 - Math.sqrt(d2) / grabDist);
            ctx.strokeStyle = `rgba(255,255,255,${a.toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseout', onLeave);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10 pointer-events-none">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}

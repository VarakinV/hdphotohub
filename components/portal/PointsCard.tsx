'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Drone,
  Clapperboard,
  Image as ImageIcon,
  Sun,
  Camera,
  Sparkles,
} from 'lucide-react';

type PointsCardProps = {
  points: number;
};

function AnimatedCounter({
  value,
  duration = 1200,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const startValRef = useRef(0);

  useEffect(() => {
    // reset start values on change
    startRef.current = null;
    startValRef.current = 0;

    const tick = (ts: number) => {
      if (startRef.current == null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(
        startValRef.current + eased * (value - startValRef.current)
      );
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration]);

  return (
    <div className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#ca4153]">
      {display.toLocaleString()}
    </div>
  );
}

export default function PointsCard({ points }: PointsCardProps) {
  const rewards = useMemo(
    () => [
      { label: 'Drone Photos', pts: 12500, Icon: Drone },
      { label: 'Social Media Reel (video)', pts: 15000, Icon: Clapperboard },
      { label: 'Virtual Staging (1 photo)', pts: 3500, Icon: ImageIcon },
      { label: 'Virtual Staging (3 photos)', pts: 10000, Icon: ImageIcon },
      { label: 'Virtual Twilight (1 photo)', pts: 2500, Icon: Sun },
      { label: 'Detailed Shots (3–4 images)', pts: 3500, Icon: Camera },
    ],
    []
  );

  return (
    <Card className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Your Points</h2>
          <p className="text-sm text-gray-600">Track and redeem your rewards</p>
        </div>
        <Sparkles className="h-5 w-5 text-primary/80" />
      </div>

      <div className="mt-3">
        <AnimatedCounter value={Math.max(0, Number(points) || 0)} />
        <div className="text-sm text-gray-500 mt-1">Total points</div>
      </div>

      {/* Rewards grid */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {rewards.map(({ label, pts, Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium truncate">{label}</div>
              <div className="text-xs text-gray-500">
                {pts.toLocaleString()} points
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* How to earn */}
      <div className="mt-4 rounded-lg border border-gray-200 p-3 bg-white/50">
        <div className="text-lg font-medium mb-1">How to Earn Points</div>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>
            📸 Place orders with us and earn points for every completed service
          </li>
          <li>⭐ Write a 5-star review → 3,500 points</li>
          <li>🤝 Refer our business → 5,000 points</li>
        </ul>
      </div>
    </Card>
  );
}

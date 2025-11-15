'use client';

export function ProgressBar({
  value,
  max = 100,
}: {
  value: number;
  max?: number;
}) {
  const pct = Math.max(0, Math.min(100, Math.round((value / max) * 100)));
  return (
    <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
      <div
        className="h-full bg-green-600 transition-[width] duration-700 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Music2 } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  genre: string | null;
  mood: string | null;
}

export function RemotionMusicPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (trackId: string) => void;
}) {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/music-tracks', { cache: 'no-store' })
      .then((r) => r.json())
      .then((j) => setTracks(j.tracks || []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  const selected = tracks.find((t) => t.id === value);

  return (
    <div className="flex items-center gap-2">
      <Music2 className="h-4 w-4 text-gray-400 shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
        className="border rounded-md px-2 py-1.5 text-sm bg-white max-w-[220px]"
      >
        <option value="">No music</option>
        {tracks.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
            {t.duration > 0 ? ` (${t.duration.toFixed(1)}s)` : ''}
          </option>
        ))}
      </select>
      {selected && (
        <audio controls preload="none" src={selected.fileUrl} className="h-8 w-36" />
      )}
    </div>
  );
}

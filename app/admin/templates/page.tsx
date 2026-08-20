'use client';

import { useEffect, useState } from 'react';
import { AdminNavbar } from '@/components/admin/admin-navbar';
import AdminTwoColumnShell from '@/components/admin/AdminTwoColumnShell';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { TemplatePreview } from '@/components/admin/template-preview';
import { Loader2, Music2, Pencil, Play, Trash2 } from 'lucide-react';

interface TemplateRow {
  id: string;
  variantKey: string;
  provider: string;
  status: string;
  name: string;
  description: string | null;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  compositionId: string;
  defaultMusicTrack: { id: string; name: string } | null;
  _count: { reels: number };
}

interface MusicTrack {
  id: string;
  name: string;
  fileUrl: string;
  duration: number;
  genre: string | null;
  mood: string | null;
  _count: { reels: number };
}

export default function TemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);

  const [musicOpen, setMusicOpen] = useState(false);
  const [editingTrackId, setEditingTrackId] = useState<string | null>(null);
  const [musicForm, setMusicForm] = useState({ name: '', fileUrl: '', duration: '', genre: '', mood: '' });
  const [savingMusic, setSavingMusic] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [tRes, mRes] = await Promise.all([fetch('/api/admin/templates'), fetch('/api/admin/music')]);
      if (tRes.ok) setTemplates((await tRes.json()).templates || []);
      if (mRes.ok) setTracks((await mRes.json()).tracks || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (t: TemplateRow) => {
    const next = t.status === 'active' ? 'draft' : 'active';
    const res = await fetch('/api/admin/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, status: next }),
    });
    if (res.ok) {
      setTemplates((list) => list.map((r) => (r.id === t.id ? { ...r, status: next } : r)));
      toast.success(`${t.name} is now ${next}`);
    } else {
      toast.error('Failed to update template');
    }
  };

  const setDefaultMusic = async (t: TemplateRow, defaultMusicTrackId: string) => {
    const res = await fetch('/api/admin/templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, defaultMusicTrackId: defaultMusicTrackId || null }),
    });
    if (res.ok) {
      const { template: updated } = await res.json();
      setTemplates((list) =>
        list.map((r) =>
          r.id === t.id
            ? { ...r, defaultMusicTrack: updated.defaultMusicTrack }
            : r
        )
      );
      toast.success(defaultMusicTrackId ? 'Default track set' : 'Default track removed');
    } else {
      toast.error('Failed to update default track');
    }
  };

  const openAddMusic = () => {
    setEditingTrackId(null);
    setMusicForm({ name: '', fileUrl: '', duration: '', genre: '', mood: '' });
    setMusicOpen(true);
  };

  const openEditMusic = (tr: MusicTrack) => {
    setEditingTrackId(tr.id);
    setMusicForm({
      name: tr.name,
      fileUrl: tr.fileUrl,
      duration: tr.duration > 0 ? String(tr.duration) : '',
      genre: tr.genre || '',
      mood: tr.mood || '',
    });
    setMusicOpen(true);
  };

  const submitMusic = async () => {
    setSavingMusic(true);
    try {
      const payload = {
        ...(editingTrackId ? { id: editingTrackId } : {}),
        name: musicForm.name,
        fileUrl: musicForm.fileUrl,
        duration: Number(musicForm.duration || 0),
        genre: musicForm.genre,
        mood: musicForm.mood,
      };
      const res = await fetch('/api/admin/music', {
        method: editingTrackId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setMusicForm({ name: '', fileUrl: '', duration: '', genre: '', mood: '' });
        setEditingTrackId(null);
        setMusicOpen(false);
        toast.success(editingTrackId ? 'Music track updated' : 'Music track added');
        load();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error || 'Failed to save track');
      }
    } finally {
      setSavingMusic(false);
    }
  };

  const deleteMusic = async (tr: MusicTrack) => {
    if (!window.confirm(`Delete "${tr.name}" from the music library?`)) return;
    const res = await fetch(`/api/admin/music?id=${encodeURIComponent(tr.id)}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Music track deleted');
      load();
    } else {
      const data = await res.json().catch(() => ({}));
      toast.error(data?.error || 'Failed to delete track');
    }
  };

  return (
    <div className="min-h-screen">
      <AdminNavbar />
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Video Templates</h1>
              <p className="text-sm text-gray-600 mt-1">
                Remotion compositions — preview, then set DRAFT → ACTIVE to enable production renders.
              </p>
            </div>
            <Button onClick={openAddMusic}>
              <Music2 className="mr-2 h-4 w-4" /> Add Music Track
            </Button>
          </div>
        </div>
      </header>

      <AdminTwoColumnShell>
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="p-8 text-center text-gray-600">No templates yet. Run the seed script.</Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {templates.map((t) => (
              <Card key={t.id} className="overflow-hidden">
                <div className="p-3 bg-gray-50 border-b">
                  <TemplatePreview compositionId={t.compositionId} />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900">{t.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t.variantKey} · {t.compositionId} · {t.width}×{t.height} · {t.fps}fps ·{' '}
                        {(t.durationInFrames / t.fps).toFixed(1)}s
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  {t.description && <p className="text-sm text-gray-600 mt-2">{t.description}</p>}
                  <div className="mt-3 pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs text-gray-500 shrink-0">Default music</label>
                      <select
                        value={t.defaultMusicTrack?.id || ''}
                        onChange={(e) => setDefaultMusic(t, e.target.value)}
                        className="border rounded-md px-2 py-1 text-xs bg-white max-w-[170px]"
                      >
                        <option value="">No music</option>
                        {tracks.map((tr) => (
                          <option key={tr.id} value={tr.id}>
                            {tr.name}
                            {tr.duration > 0 ? ` (${tr.duration.toFixed(1)}s)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-gray-500">{t._count.reels} renders</div>
                      <Switch checked={t.status === 'active'} onCheckedChange={() => toggleStatus(t)} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Play className="h-4 w-4 text-gray-500" /> Music Library
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Royalty-free tracks (10–20s). Picked per reel in the order UI and baked in at render.
          </p>
          {tracks.length === 0 ? (
            <p className="text-sm text-gray-500 mt-3">No tracks yet.</p>
          ) : (
            <ul className="mt-3 divide-y">
              {tracks.map((tr) => (
                <li key={tr.id} className="py-2 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{tr.name}</div>
                    <div className="text-xs text-gray-500">
                      {tr.duration > 0 ? `${tr.duration.toFixed(1)}s` : 'duration unknown'}
                      {tr.mood ? ` · ${tr.mood}` : ''}
                      {tr.genre ? ` · ${tr.genre}` : ''}
                      {tr._count.reels > 0 ? ` · used ${tr._count.reels}x` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <audio controls preload="none" src={tr.fileUrl} className="h-8 w-40" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => openEditMusic(tr)}
                      aria-label={`Edit ${tr.name}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      onClick={() => deleteMusic(tr)}
                      aria-label={`Delete ${tr.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </AdminTwoColumnShell>

      {musicOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <h3 className="font-semibold text-gray-900">
              {editingTrackId ? 'Edit Music Track' : 'Add Music Track'}
            </h3>
            <div className="space-y-3 mt-4">
              <div>
                <label className="text-xs text-gray-500">Name</label>
                <Input value={musicForm.name} onChange={(e) => setMusicForm({ ...musicForm, name: e.target.value })} placeholder="Upbeat house walkthrough" />
              </div>
              <div>
                <label className="text-xs text-gray-500">File URL (mp3/wav, hosted)</label>
                <Input value={musicForm.fileUrl} onChange={(e) => setMusicForm({ ...musicForm, fileUrl: e.target.value })} placeholder="https://..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-gray-500">Duration (s)</label>
                  <Input type="number" value={musicForm.duration} onChange={(e) => setMusicForm({ ...musicForm, duration: e.target.value })} placeholder="15" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Genre</label>
                  <Input value={musicForm.genre} onChange={(e) => setMusicForm({ ...musicForm, genre: e.target.value })} placeholder="pop" />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Mood</label>
                  <Input value={musicForm.mood} onChange={(e) => setMusicForm({ ...musicForm, mood: e.target.value })} placeholder="upbeat" />
                </div>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setMusicOpen(false)}>Cancel</Button>
              <Button onClick={submitMusic} disabled={!musicForm.name || !musicForm.fileUrl || savingMusic}>
                {savingMusic ? 'Saving…' : editingTrackId ? 'Save Changes' : 'Add'}
              </Button>
            </div>
          </Card>
        </div>
      )}

      <Toaster />
    </div>
  );
}

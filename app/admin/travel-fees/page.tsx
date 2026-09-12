'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Plus } from 'lucide-react';
import { DeleteIconButton } from '@/components/admin/ui/icon-action';

type Town = { id: string; cityName: string; feeCents: number; active: boolean };
const dollars = (cents: number) => (Number(cents || 0) / 100).toFixed(2);

export default function TravelFeesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [freeRadiusKm, setFreeRadiusKm] = useState(35);
  const [perKmRateDollars, setPerKmRateDollars] = useState('0.85');
  const [towns, setTowns] = useState<Town[]>([]);
  const [newCity, setNewCity] = useState('');
  const [newFee, setNewFee] = useState('30.00');

  async function load() {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/travel-fees');
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to load');
      setFreeRadiusKm(Number(data.settings?.travelFreeRadiusKm ?? 35));
      setPerKmRateDollars(dollars(data.settings?.travelPerKmRateCents ?? 85));
      setTowns(data.towns || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function saveSettings() {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/travel-fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ travelFreeRadiusKm: freeRadiusKm, travelPerKmRateDollars: perKmRateDollars }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save');
      toast.success('Travel fee settings saved');
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function addTown() {
    try {
      const res = await fetch('/api/admin/travel-fees/towns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName: newCity, feeDollars: newFee }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to add town');
      setNewCity(''); setNewFee('30.00'); await load(); toast.success('Town added');
    } catch (e: any) { toast.error(e.message || 'Failed to add town'); }
  }

  async function updateTown(town: Town) {
    try {
      const res = await fetch(`/api/admin/travel-fees/towns/${town.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cityName: town.cityName, feeDollars: dollars(town.feeCents), active: town.active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to update town');
      await load(); toast.success('Town updated');
    } catch (e: any) { toast.error(e.message || 'Failed to update town'); }
  }

  async function deleteTown(id: string) {
    if (!confirm('Delete this flat-fee town?')) return;
    const res = await fetch(`/api/admin/travel-fees/towns/${id}`, { method: 'DELETE' });
    if (!res.ok) return toast.error('Failed to delete town');
    await load(); toast.success('Town deleted');
  }

  return (
    <div className="min-h-screen">
      <div className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2 className="font-display text-[22px] font-semibold text-foreground">Travel Fees</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure free radius, per-km rate, and flat-fee towns.</p>
        </div>
      </div>
      <div className="space-y-6">
        {error && <div className="text-sm text-[#c23434] dark:text-[#f09a9a]">{error}</div>}
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">General Rules</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label>Free Travel Radius (km)</Label><Input type="number" value={freeRadiusKm} onChange={(e) => setFreeRadiusKm(Number(e.target.value || 0))} disabled={loading} /></div>
            <div><Label>Per-km Rate ($)</Label><Input type="number" step="0.01" value={perKmRateDollars} onChange={(e) => setPerKmRateDollars(e.target.value)} disabled={loading} /></div>
          </div>
          <div className="flex justify-end"><Button onClick={saveSettings} disabled={saving || loading}>{saving ? 'Saving…' : 'Save Settings'}</Button></div>
        </Card>
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">Flat Fee Towns</h2>
          <div className="grid sm:grid-cols-[1fr_140px_auto] gap-2 items-end">
            <div><Label>City/Town</Label><Input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="e.g., Strathmore" /></div>
            <div><Label>Flat Fee ($)</Label><Input type="number" step="0.01" value={newFee} onChange={(e) => setNewFee(e.target.value)} /></div>
            <Button onClick={addTown} disabled={!newCity.trim()}><Plus className="h-4 w-4 mr-1" />Add</Button>
          </div>
          <div className="space-y-2">
            {towns.map((t, i) => (
              <div key={t.id} className="grid sm:grid-cols-[1fr_140px_90px_auto] gap-2 items-center border rounded-md p-2">
                <Input value={t.cityName} onChange={(e) => setTowns((xs) => xs.map((x, n) => n === i ? { ...x, cityName: e.target.value } : x))} />
                <Input type="number" step="0.01" value={dollars(t.feeCents)} onChange={(e) => setTowns((xs) => xs.map((x, n) => n === i ? { ...x, feeCents: Math.round(Number(e.target.value || 0) * 100) } : x))} />
                <label className="text-sm flex gap-2"><input type="checkbox" checked={t.active} onChange={(e) => setTowns((xs) => xs.map((x, n) => n === i ? { ...x, active: e.target.checked } : x))} />Active</label>
                <div className="flex gap-2 justify-end"><Button size="sm" onClick={() => updateTown(t)}>Save</Button><DeleteIconButton onClick={() => { void deleteTown(t.id); }} /></div>
              </div>
            ))}
            {!loading && towns.length === 0 && <div className="text-sm text-muted-foreground">No towns yet.</div>}
          </div>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Category = { id: string; name: string; slug: string; description: string | null; iconUrl: string | null; active: boolean };
type Tax = { id: string; name: string; rateBps: number; active: boolean };

type Service = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  description: string | null;
  priceCents: number;
  durationMin: number;
  bufferBeforeMin: number;
  bufferAfterMin: number;
  minSqFt: number | null;
  maxSqFt: number | null;
  active: boolean;
  category?: Category;
  taxes?: Tax[];
};

export default function ServicesManager() {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [taxes, setTaxes] = useState<Tax[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Forms
  const [catName, setCatName] = useState("");
  const [taxName, setTaxName] = useState("");
  const [taxRate, setTaxRate] = useState(5);
  const [svcName, setSvcName] = useState("");
  const [svcCategoryId, setSvcCategoryId] = useState("");
  const [svcPrice, setSvcPrice] = useState(0);
  const [svcDuration, setSvcDuration] = useState(60);
  const [svcMinSqFt, setSvcMinSqFt] = useState<number | "">("");
  const [svcMaxSqFt, setSvcMaxSqFt] = useState<number | "">("");
  const [svcTaxIds, setSvcTaxIds] = useState<string[]>([]);

  const taxOptions = useMemo(() => taxes.map(t => ({ id: t.id, label: `${t.name} (${(t.rateBps/100).toFixed(2)}%)` })), [taxes]);

  async function refreshAll() {
    setLoading(true);
    try {
      const [cats, txs, svcs] = await Promise.all([
        fetch("/api/service-categories").then(r => r.json()),
        fetch("/api/taxes").then(r => r.json()),
        fetch("/api/services").then(r => r.json()),
      ]);
      setCategories(cats);
      setTaxes(txs);
      setServices(svcs);
      if (!svcCategoryId && cats[0]) setSvcCategoryId(cats[0].id);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refreshAll(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  async function createCategory() {
    if (!catName.trim()) return;
    await fetch("/api/service-categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: catName }) });
    setCatName("");
    await refreshAll();
  }

  async function createTax() {
    if (!taxName.trim()) return;
    const rateBps = Math.round(Number(taxRate) * 100);
    await fetch("/api/taxes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: taxName, rateBps }) });
    setTaxName("");
    setTaxRate(5);
    await refreshAll();
  }

  async function createService() {
    if (!svcName.trim() || !svcCategoryId) return;
    await fetch("/api/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      categoryId: svcCategoryId,
      name: svcName,
      priceCents: Math.round(Number(svcPrice)),
      durationMin: Math.round(Number(svcDuration)),
      minSqFt: svcMinSqFt === "" ? null : Number(svcMinSqFt),
      maxSqFt: svcMaxSqFt === "" ? null : Number(svcMaxSqFt),
      taxIds: svcTaxIds,
    }) });
    setSvcName("");
    setSvcPrice(0);
    setSvcDuration(60);
    setSvcMinSqFt("");
    setSvcMaxSqFt("");
    setSvcTaxIds([]);
    await refreshAll();
  }

  return (
    <div className="grid gap-8">
      {/* Categories */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Categories</h2>
        <div className="flex gap-2 items-end mb-4">
          <div className="flex-1">
            <Label htmlFor="catName">Name</Label>
            <Input id="catName" value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Essential" />
          </div>
          <Button onClick={createCategory} disabled={loading}>Add</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.map(c => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.active ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Taxes */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Taxes</h2>
        <div className="flex gap-2 items-end mb-4">
          <div className="flex-1">
            <Label htmlFor="taxName">Name</Label>
            <Input id="taxName" value={taxName} onChange={(e) => setTaxName(e.target.value)} placeholder="GST" />
          </div>
          <div className="w-40">
            <Label htmlFor="taxRate">Rate (%)</Label>
            <Input id="taxRate" type="number" step="0.01" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} />
          </div>
          <Button onClick={createTax} disabled={loading}>Add</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Rate</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {taxes.map(t => (
              <TableRow key={t.id}>
                <TableCell>{t.name}</TableCell>
                <TableCell>{(t.rateBps/100).toFixed(2)}%</TableCell>
                <TableCell>{t.active ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Services */}
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">Services</h2>
        <div className="grid gap-3 md:grid-cols-6 mb-4">
          <div className="md:col-span-2">
            <Label htmlFor="svcName">Name</Label>
            <Input id="svcName" value={svcName} onChange={(e) => setSvcName(e.target.value)} placeholder="Up to 1000 sqft" />
          </div>
          <div>
            <Label htmlFor="svcCategory">Category</Label>
            <select id="svcCategory" className="w-full h-10 rounded-md border px-3" value={svcCategoryId} onChange={(e) => setSvcCategoryId(e.target.value)}>
              {categories.map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}
            </select>
          </div>
          <div>
            <Label htmlFor="svcPrice">Price (cents)</Label>
            <Input id="svcPrice" type="number" value={svcPrice} onChange={(e) => setSvcPrice(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="svcDuration">Duration (min)</Label>
            <Input id="svcDuration" type="number" value={svcDuration} onChange={(e) => setSvcDuration(Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="svcMinSqFt">Min sqft</Label>
            <Input id="svcMinSqFt" type="number" value={svcMinSqFt} onChange={(e) => setSvcMinSqFt(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div>
            <Label htmlFor="svcMaxSqFt">Max sqft</Label>
            <Input id="svcMaxSqFt" type="number" value={svcMaxSqFt} onChange={(e) => setSvcMaxSqFt(e.target.value === "" ? "" : Number(e.target.value))} />
          </div>
          <div className="md:col-span-6">
            <Label>Taxes (per-service toggle)</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {taxOptions.map(opt => (
                <label key={opt.id} className="inline-flex items-center gap-2 text-sm border rounded px-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="cursor-pointer"
                    checked={svcTaxIds.includes(opt.id)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setSvcTaxIds(prev => checked ? [...prev, opt.id] : prev.filter(id => id !== opt.id));
                    }}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
          <div className="md:col-span-6">
            <Button onClick={createService} disabled={loading || !svcCategoryId || !svcName.trim()}>Add Service</Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Sqft</TableHead>
              <TableHead>Taxes</TableHead>
              <TableHead>Active</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {services.map(s => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.category?.name ?? "-"}</TableCell>
                <TableCell>${(s.priceCents/100).toFixed(2)}</TableCell>
                <TableCell>{s.durationMin} min</TableCell>
                <TableCell>{s.minSqFt ?? "-"} - {s.maxSqFt ?? "-"}</TableCell>
                <TableCell>{s.taxes?.map(t => t.name).join(", ") || "-"}</TableCell>
                <TableCell>{s.active ? "Yes" : "No"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}


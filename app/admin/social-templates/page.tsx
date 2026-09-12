'use client';

import { useEffect, useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Loader2, ImageIcon } from 'lucide-react';

interface SocialTemplateRow {
  id: string;
  variantKey: string;
  status: string;
  name: string;
  description: string | null;
  label: string | null;
  sortOrder: number;
  _count: { posts: number };
}

export default function SocialTemplatesPage() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<SocialTemplateRow[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<string, string>>({});

  async function load() {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/social-templates', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
        const urls: Record<string, string> = {};
        for (const t of data) {
          urls[t.variantKey] = `/api/admin/social-templates/${t.variantKey}/preview?t=${Date.now()}`;
        }
        setPreviewUrls(urls);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (t: SocialTemplateRow) => {
    const next = t.status === 'active' ? 'draft' : 'active';
    const res = await fetch('/api/admin/social-templates', {
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

  const saveLabel = async (t: SocialTemplateRow, label: string) => {
    const res = await fetch('/api/admin/social-templates', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, label }),
    });
    if (res.ok) {
      setTemplates((list) => list.map((r) => (r.id === t.id ? { ...r, label } : r)));
      toast.success('Label updated');
    } else {
      toast.error('Failed to update label');
    }
  };

  return (
    <div className="min-h-screen">
      <div className="mb-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-[22px] font-semibold text-foreground">Social Media Post Templates</h2>
            <p className="text-sm text-muted-foreground mt-1">
              12 still-image (1080×1350, 4:5) Canva-style social posts generated for each order. Set DRAFT → ACTIVE to enable.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-faint" />
          </div>
        ) : templates.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">No templates yet. Run `node prisma/seed-social.cjs`.</Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {templates.map((t) => (
              <Card key={t.id} className="overflow-hidden">
                <div className="p-3 bg-surface-2 border-b flex justify-center">
                  {previewUrls[t.variantKey] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={previewUrls[t.variantKey]}
                      alt={`${t.name} preview`}
                      className="w-[200px] h-[250px] object-cover rounded-md border bg-white"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-[200px] h-[250px] flex items-center justify-center bg-white rounded-md border">
                      <ImageIcon className="h-8 w-8 text-faint" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-foreground">{t.name}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.variantKey} · 1080×1350</p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.status === 'active' ? 'bg-[#e4f4ea] dark:bg-[#123322] text-[#1c7a41] dark:text-[#7fe0a3]' : 'bg-[#fdf3e0] dark:bg-[#33270f] text-[#9a6a12] dark:text-[#f0c674]'
                      }`}
                    >
                      {t.status.toUpperCase()}
                    </span>
                  </div>
                  {t.description && <p className="text-sm text-muted-foreground mt-2">{t.description}</p>}
                  <div className="mt-3 pt-3 border-t space-y-3">
                    <div>
                      <label className="text-xs text-muted-foreground">Headline label (overrides default)</label>
                      <Input
                        defaultValue={t.label || ''}
                        onBlur={(e) => {
                          const next = e.target.value;
                          if (next !== (t.label || '')) saveLabel(t, next);
                        }}
                        placeholder={t.name.toUpperCase()}
                        className="mt-1 text-xs"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs text-muted-foreground">{t._count.posts} posts generated</div>
                      <Switch checked={t.status === 'active'} onCheckedChange={() => toggleStatus(t)} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Card className="p-5">
          <h3 className="font-semibold text-foreground">How it works</h3>
          <ul className="mt-3 text-sm text-muted-foreground list-disc pl-5 space-y-1.5">
            <li>Templates are rendered server-side using Satori + resvg + Sharp. No external platforms.</li>
            <li>Each template consumes 1–3 photos from the order&apos;s Reel source images, plus realtor headshot and brokerage logo.</li>
            <li>Headline text (label) is editable per template here — defaults match the template name.</li>
            <li>Active templates auto-enqueue when an order&apos;s &quot;Generate Posts&quot; button is clicked.</li>
            <li>Output is a PNG (1080×1350, ~150–300 KB) stored in <code className="bg-surface-2 px-1 rounded">orders/{'{id}'}/social-posts/</code>.</li>
          </ul>
        </Card>
      </div>
      <Toaster />
    </div>
  );
}

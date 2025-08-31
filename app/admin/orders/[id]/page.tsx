'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  realtor: { id: string; firstName: string; lastName: string };
  propertyAddress: string;
  propertySize?: number | null;
  yearBuilt?: number | null;
  mlsNumber?: string | null;
  listPrice?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  description?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  slug: string;
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [tab, setTab] = useState<'property' | 'photos' | 'videos' | 'floor' | 'attach' | 'embed'>('property');

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) setOrder(await res.json());
    })();
  }, [params?.id]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Order Details</h1>
          <p className="text-sm text-gray-600">{order ? `${order.realtor.firstName} ${order.realtor.lastName} — ${order.propertyAddress}` : ''}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/admin/orders">Back to Orders</Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b mb-4 flex gap-4">
        {[
          { key: 'property', label: 'Property Data' },
          { key: 'photos', label: 'Photos' },
          { key: 'videos', label: 'Videos' },
          { key: 'floor', label: 'Floor Plans' },
          { key: 'attach', label: 'Attachments' },
          { key: 'embed', label: 'Embedded Media' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`pb-2 border-b-2 -mb-px ${tab === t.key ? 'border-primary' : 'border-transparent text-gray-500'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-lg border p-6">
        {tab === 'property' && order && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><div className="text-xs text-gray-500">Realtor</div><div className="font-medium">{order.realtor.firstName} {order.realtor.lastName}</div></div>
            <div><div className="text-xs text-gray-500">Property Address</div><div className="font-medium">{order.propertyAddress}</div></div>
            <div><div className="text-xs text-gray-500">MLS #</div><div className="font-medium">{order.mlsNumber || '—'}</div></div>
            <div><div className="text-xs text-gray-500">Size (sqft)</div><div className="font-medium">{order.propertySize ?? '—'}</div></div>
            <div><div className="text-xs text-gray-500">Year Built</div><div className="font-medium">{order.yearBuilt ?? '—'}</div></div>
            <div><div className="text-xs text-gray-500">List Price</div><div className="font-medium">{order.listPrice ?? '—'}</div></div>
            <div><div className="text-xs text-gray-500">Bedrooms</div><div className="font-medium">{order.bedrooms ?? '—'}</div></div>
            <div><div className="text-xs text-gray-500">Bathrooms</div><div className="font-medium">{order.bathrooms ?? '—'}</div></div>
            <div className="sm:col-span-2"><div className="text-xs text-gray-500">Description</div><div className="font-medium whitespace-pre-wrap">{order.description || '—'}</div></div>
          </div>
        )}
        {tab !== 'property' && (
          <div className="text-gray-500">Coming Soon</div>
        )}
      </div>
    </div>
  );
}


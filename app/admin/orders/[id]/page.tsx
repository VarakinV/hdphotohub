'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AdminNavbar } from '@/components/admin/admin-navbar';

import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { PhotosUploader } from '@/components/orders/photos-uploader';
import { PhotosGrid } from '@/components/orders/photos-grid';
import { VideosUploader } from '@/components/orders/videos-uploader';
import { VideosGrid } from '@/components/orders/videos-grid';
import { FloorplansUploader } from '@/components/orders/floorplans-uploader';
import { FloorplansGrid } from '@/components/orders/floorplans-grid';
import { AttachmentsUploader } from '@/components/orders/attachments-uploader';
import { AttachmentsList } from '@/components/orders/attachments-list';
import { EmbedsForm } from '@/components/orders/embeds-form';
import { EmbedsList } from '@/components/orders/embeds-list';
import { RegenerateMlsButton } from '@/components/admin/RegenerateMlsButton';
import PlacesAddressInput from '@/components/admin/PlacesAddressInput';

interface Order {
  id: string;
  realtor: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    companyName?: string;
  };
  propertyAddress: string;
  propertyFormattedAddress?: string | null;
  propertyLat?: number | null;
  propertyLng?: number | null;
  propertyCity?: string | null;
  propertyProvince?: string | null;
  propertyPostalCode?: string | null;
  propertyCountry?: string | null;
  propertyPlaceId?: string | null;
  propertySize?: number | null;
  yearBuilt?: number | null;
  mlsNumber?: string | null;
  listPrice?: number | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  featuresText?: string | null;
  description?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  slug: string;
}

export default function OrderDetailsPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [tab, setTab] = useState<
    'property' | 'photos' | 'videos' | 'floor' | 'attach' | 'embed'
  >('property');
  const [photoRefresh, setPhotoRefresh] = useState(0);
  const [videoRefresh, setVideoRefresh] = useState(0);
  const [floorRefresh, setFloorRefresh] = useState(0);
  const [attachRefresh, setAttachRefresh] = useState(0);
  const [embedRefresh, setEmbedRefresh] = useState(0);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<{
    lat: number | null;
    lng: number | null;
  } | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    (async () => {
      const res = await fetch(`/api/orders/${params.id}`);
      if (res.ok) setOrder(await res.json());
    })();
  }, [params?.id]);

  useEffect(() => {
    if (order) {
      setPreview({
        lat: order.propertyLat ?? null,
        lng: order.propertyLng ?? null,
      });
    }
  }, [order]);

  return (
    <>
      <AdminNavbar />
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold">Order Details</h1>
            <p className="text-sm text-gray-600">
              {order
                ? `${order.realtor.firstName} ${order.realtor.lastName} — ${order.propertyAddress}`
                : ''}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/admin/orders">Back to Orders</Link>
            </Button>
            {order?.id && <RegenerateMlsButton orderId={order.id} />}
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
              className={`pb-2 border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-primary'
                  : 'border-transparent text-gray-500'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="bg-white rounded-lg border p-6">
          {tab === 'property' && order && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-gray-500">Realtor</div>
                  <div className="font-medium">
                    {order.realtor.firstName} {order.realtor.lastName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Property Address</div>
                  <div className="font-medium">
                    {order.propertyFormattedAddress || order.propertyAddress}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">MLS #</div>
                  <div className="font-medium">{order.mlsNumber || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Size (sqft)</div>
                  <div className="font-medium">{order.propertySize ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Year Built</div>
                  <div className="font-medium">{order.yearBuilt ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">List Price</div>
                  <div className="font-medium">{order.listPrice ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Bedrooms</div>
                  <div className="font-medium">{order.bedrooms ?? '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Bathrooms</div>
                  <div className="font-medium">{order.bathrooms ?? '—'}</div>
                </div>
                <div className="sm:col-span-2">
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="font-medium whitespace-pre-wrap">
                    {order.description || '—'}
                  </div>
                </div>
              </div>

              {editing ? (
                <div className="border rounded-md p-4">
                  <form
                    className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.currentTarget as HTMLFormElement;
                      const formData = new FormData(form);
                      const payload = Object.fromEntries(formData.entries());
                      const num = (v: any) =>
                        v === '' || v == null ? null : Number(v);
                      const body = {
                        propertyAddress: String(
                          payload.propertyAddress || order.propertyAddress
                        ),
                        propertyFormattedAddress:
                          String(payload.propertyFormattedAddress || '') ||
                          null,
                        propertyLat: payload.propertyLat
                          ? Number(payload.propertyLat)
                          : null,
                        propertyLng: payload.propertyLng
                          ? Number(payload.propertyLng)
                          : null,
                        propertyCity:
                          String(payload.propertyCity || '') || null,
                        propertyProvince:
                          String(payload.propertyProvince || '') || null,
                        propertyPostalCode:
                          String(payload.propertyPostalCode || '') || null,
                        propertyCountry:
                          String(payload.propertyCountry || '') || null,
                        propertyPlaceId:
                          String(payload.propertyPlaceId || '') || null,
                        mlsNumber: String(payload.mlsNumber || '') || null,
                        yearBuilt: num(payload.yearBuilt),
                        propertySize: num(payload.propertySize),
                        listPrice: num(payload.listPrice),
                        bedrooms: num(payload.bedrooms),
                        bathrooms: num(payload.bathrooms),
                        featuresText:
                          String(payload.featuresText || '') || null,
                        description: String(payload.description || '') || null,
                        status: (payload.status as string) || order.status,
                      };
                      const res = await fetch(`/api/orders/${order.id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body),
                      });
                      if (res.ok) {
                        const updated = await res.json();
                        setOrder(updated);
                        setEditing(false);
                        toast.success('Changes saved');
                      } else {
                        toast.error('Failed to save');
                      }
                    }}
                  >
                    <div>
                      <label className="text-xs text-gray-500">
                        Property Address
                      </label>
                      <PlacesAddressInput
                        name="propertyAddress"
                        defaultValue={order.propertyAddress}
                        defaultFormattedAddress={
                          order.propertyFormattedAddress ??
                          order.propertyAddress
                        }
                        defaultLat={order.propertyLat ?? null}
                        defaultLng={order.propertyLng ?? null}
                        defaultCity={order.propertyCity ?? null}
                        defaultProvince={order.propertyProvince ?? null}
                        defaultPostalCode={order.propertyPostalCode ?? null}
                        defaultCountry={order.propertyCountry ?? null}
                        defaultPlaceId={order.propertyPlaceId ?? null}
                        onResolved={(d) =>
                          setPreview({ lat: d.lat ?? null, lng: d.lng ?? null })
                        }
                      />
                      {preview?.lat != null && preview?.lng != null && (
                        <div className="mt-3 aspect-video rounded overflow-hidden border">
                          <iframe
                            src={`https://www.google.com/maps?q=${preview.lat},${preview.lng}&z=15&output=embed`}
                            className="w-full h-full"
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">MLS #</label>
                      <input
                        name="mlsNumber"
                        defaultValue={order.mlsNumber ?? ''}
                        className="border rounded-md w-full p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        Year Built
                      </label>
                      <input
                        type="number"
                        name="yearBuilt"
                        defaultValue={order.yearBuilt ?? ''}
                        className="border rounded-md w-full p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        Size (sqft)
                      </label>
                      <input
                        type="number"
                        name="propertySize"
                        defaultValue={order.propertySize ?? ''}
                        className="border rounded-md w-full p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">
                        List Price
                      </label>
                      <input
                        type="number"
                        name="listPrice"
                        defaultValue={order.listPrice ?? ''}
                        className="border rounded-md w-full p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Bedrooms</label>
                      <input
                        type="number"
                        name="bedrooms"
                        defaultValue={order.bedrooms ?? ''}
                        className="border rounded-md w-full p-2"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Bathrooms</label>
                      <input
                        type="number"
                        name="bathrooms"
                        defaultValue={order.bathrooms ?? ''}
                        className="border rounded-md w-full p-2"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500">
                        Description
                      </label>
                      <textarea
                        name="description"
                        defaultValue={order.description ?? ''}
                        className="border rounded-md w-full p-2"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs text-gray-500">
                        Features (one per line)
                      </label>
                      <textarea
                        name="featuresText"
                        defaultValue={order.featuresText ?? ''}
                        className="border rounded-md w-full p-2"
                        placeholder={
                          'E.g.\nQuartz countertops\nHardwood floors\nSouth-facing backyard'
                        }
                      />
                    </div>

                    <div>
                      <label className="text-xs text-gray-500">Status</label>
                      <select
                        name="status"
                        defaultValue={order.status}
                        className="border rounded-md w-full p-2"
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditing(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">Save</Button>
                    </div>
                  </form>
                </div>
              ) : (
                <div className="flex justify-end">
                  <Button variant="outline" onClick={() => setEditing(true)}>
                    Edit
                  </Button>
                </div>
              )}
            </div>
          )}

          {tab === 'photos' && order && (
            <div className="space-y-4">
              <PhotosUploader
                orderId={order.id}
                onUploaded={() => setPhotoRefresh((n) => n + 1)}
              />
              <PhotosGrid orderId={order.id} refreshToken={photoRefresh} />
            </div>
          )}

          {tab === 'videos' && order && (
            <div className="space-y-4">
              <VideosUploader
                orderId={order.id}
                onUploaded={() => setVideoRefresh((n) => n + 1)}
              />
              <VideosGrid orderId={order.id} refreshToken={videoRefresh} />
            </div>
          )}

          {tab === 'floor' && order && (
            <div className="space-y-4">
              <FloorplansUploader
                orderId={order.id}
                onUploaded={() => setFloorRefresh((n) => n + 1)}
              />
              <FloorplansGrid orderId={order.id} refreshToken={floorRefresh} />
            </div>
          )}

          {tab === 'attach' && order && (
            <div className="space-y-4">
              <AttachmentsUploader
                orderId={order.id}
                onUploaded={() => setAttachRefresh((n) => n + 1)}
              />
              <AttachmentsList
                orderId={order.id}
                refreshToken={attachRefresh}
              />
            </div>
          )}

          {tab === 'embed' && order && (
            <div className="space-y-4">
              <EmbedsForm
                orderId={order.id}
                onAdded={() => setEmbedRefresh((n) => n + 1)}
              />
              <EmbedsList orderId={order.id} refreshToken={embedRefresh} />
            </div>
          )}
        </div>
        <Toaster />
      </div>
    </>
  );
}

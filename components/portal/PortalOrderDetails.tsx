'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

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
import { sanitizeDescription } from '@/lib/sanitize';
import PlacesAddressInput from '@/components/admin/PlacesAddressInput';
import DescriptionEditor from '@/components/admin/DescriptionEditor';
import {
  Loader2,
  Home,
  Images,
  Film,
  Ruler,
  Paperclip,
  Link2,
  QrCode,
  ChevronLeft,
} from 'lucide-react';
import { StatusPill } from '@/components/admin/ui/status-pill';
import { OrderQRCodes } from '@/components/orders/OrderQRCodes';

interface Order {
  id: string;
  realtor: { id: string; firstName: string; lastName: string };
  propertyAddress: string;
  propertyFormattedAddress?: string | null;
  propertyLat?: number | null;
  propertyLng?: number | null;
  propertyCity?: string | null;
  propertyProvince?: string | null;
  propertyPostalCode?: string | null;
  propertyCountry?: string | null;
  propertyPlaceId?: string | null;
  propertyAddressOverride?: string | null;
  propertyCityOverride?: string | null;
  propertyPostalCodeOverride?: string | null;
  propertySize?: number | null;
  yearBuilt?: number | null;
  mlsNumber?: string | null;
  listPrice?: number | null;
  bedrooms?: string | null;
  bathrooms?: string | null;
  featuresText?: string | null;
  description?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  slug: string;
}

export function PortalOrderDetails({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [tab, setTab] = useState<
    'property' | 'photos' | 'videos' | 'floor' | 'attach' | 'embed' | 'qr'
  >('property');
  const [photoRefresh, setPhotoRefresh] = useState(0);
  const [videoRefresh, setVideoRefresh] = useState(0);
  const [floorRefresh, setFloorRefresh] = useState(0);
  const [loading, setLoading] = useState(true);

  type TabKey = 'property' | 'photos' | 'videos' | 'floor' | 'attach' | 'embed' | 'qr';
  type TabDef = { key: TabKey; label: string; icon: React.ElementType };

  const tabsList: TabDef[] = [
    { key: 'property', label: 'Property Info', icon: Home },
    { key: 'photos', label: 'Photos', icon: Images },
    { key: 'videos', label: 'Videos', icon: Film },
    { key: 'floor', label: 'Floor Plans', icon: Ruler },
    { key: 'attach', label: 'PDFs', icon: Paperclip },
    { key: 'embed', label: 'iGUIDE', icon: Link2 },
    { key: 'qr', label: 'QR Codes', icon: QrCode },
  ];

  const [attachRefresh, setAttachRefresh] = useState(0);
  const [embedRefresh, setEmbedRefresh] = useState(0);
  const [editing, setEditing] = useState(false);
  const [preview, setPreview] = useState<{
    lat: number | null;
    lng: number | null;
  } | null>(null);

  useEffect(() => {
    if (!orderId) return;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        if (res.ok) setOrder(await res.json());
        else toast.error('Failed to load order');
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  useEffect(() => {
    if (order)
      setPreview({
        lat: order.propertyLat ?? null,
        lng: order.propertyLng ?? null,
      });
  }, [order]);

  return (
    <div className="w-full">
      <Link
        href="/portal/orders"
        className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-brick-600"
      >
        <ChevronLeft className="h-4 w-4" /> All orders
      </Link>

      {/* Title row */}
      <div className="mb-5">
        {order && <StatusPill status={order.status} />}
        <h2 className="font-display mt-1.5 text-[22px] font-semibold leading-tight sm:text-[23px]">
          {order
            ? order.propertyFormattedAddress || order.propertyAddress
            : 'Order'}
        </h2>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          {order && (
            <span>
              {order.realtor.firstName} {order.realtor.lastName}
            </span>
          )}
          {order?.mlsNumber && (
            <>
              <span className="h-[3px] w-[3px] rounded-full bg-faint" />
              <span>MLS# {order.mlsNumber}</span>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-[68px] z-20 -mx-1 mb-1 bg-background pb-3">
        <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabsList.map((t) => {
            const active = tab === t.key;
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key as any)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[13.3px] font-semibold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-brick-500 text-white'
                    : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mb-5 border-t border-border" aria-hidden />

      {/* Loading indicator */}
      {loading && (
        <div className="mb-4 flex items-center justify-center rounded-2xl border border-border bg-card p-6">
          <Loader2 className="h-8 w-8 animate-spin text-faint" />
        </div>
      )}

      {/* Tab content */}
      <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-6">
          {tab === 'property' && order && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <div>
                  <label className="field-label">Realtor</label>
                  <div className="text-[15px] font-semibold">
                    {order.realtor.firstName} {order.realtor.lastName}
                  </div>
                </div>
                <div>
                  <label className="field-label">Property Address</label>
                  <div className="text-[15px] font-semibold">
                    {order.propertyFormattedAddress || order.propertyAddress}
                  </div>
                </div>
                <div>
                  <label className="field-label">MLS #</label>
                  <div className="text-[15px] font-semibold">{order.mlsNumber || '—'}</div>
                </div>
                <div>
                  <label className="field-label">Size (sqft)</label>
                  <div className="text-[15px] font-semibold">{order.propertySize ?? '—'}</div>
                </div>
                <div>
                  <label className="field-label">Year Built</label>
                  <div className="text-[15px] font-semibold">{order.yearBuilt ?? '—'}</div>
                </div>
                <div>
                  <label className="field-label">List Price</label>
                  <div className="text-[15px] font-semibold">
                    {order.listPrice != null ? '$' + Number(order.listPrice).toLocaleString() : '—'}
                  </div>
                </div>
                <div>
                  <label className="field-label">Bedrooms</label>
                  <div className="text-[15px] font-semibold">{order.bedrooms ?? '—'}</div>
                </div>
                <div>
                  <label className="field-label">Bathrooms</label>
                  <div className="text-[15px] font-semibold">{order.bathrooms ?? '—'}</div>
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label">Description</label>
                  {order.description ? (
                    <div
                      className="leading-7 text-foreground [&_*+_*]:mt-3 [&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:text-[13.8px] [&_ul]:list-disc [&_ul]:pl-5"
                      dangerouslySetInnerHTML={{
                        __html: sanitizeDescription(
                          String(order.description).replace(
                            /^(<br\s*\/?\>)+/i,
                            ''
                          )
                        ),
                      }}
                    />
                  ) : (
                    <div className="text-[13.8px] text-faint">—</div>
                  )}
                </div>
              </div>

            {editing ? (
              <div className="border rounded-md p-4">
                <form
                  className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget as HTMLFormElement;
                    const payload = Object.fromEntries(
                      new FormData(form).entries()
                    );
                    const num = (v: any) =>
                      v === '' || v == null ? null : Number(v);
                    const strOrNull = (v: any) =>
                      v === '' || v == null ? null : String(v);
                    const body = {
                      propertyAddress: String(
                        payload.propertyAddress || order.propertyAddress
                      ),
                      propertyFormattedAddress: strOrNull(
                        payload.propertyFormattedAddress
                      ),
                      propertyLat: payload.propertyLat
                        ? Number(payload.propertyLat)
                        : null,
                      propertyLng: payload.propertyLng
                        ? Number(payload.propertyLng)
                        : null,
                      propertyCity: strOrNull(payload.propertyCity),
                      propertyProvince: strOrNull(payload.propertyProvince),
                      propertyPostalCode: strOrNull(payload.propertyPostalCode),
                      propertyCountry: strOrNull(payload.propertyCountry),
                      propertyPlaceId: strOrNull(payload.propertyPlaceId),
                      propertyAddressOverride: strOrNull(
                        payload.propertyAddressOverride
                      ),
                      propertyCityOverride: strOrNull(
                        payload.propertyCityOverride
                      ),
                      propertyPostalCodeOverride: strOrNull(
                        payload.propertyPostalCodeOverride
                      ),
                      mlsNumber: strOrNull(payload.mlsNumber),
                      yearBuilt: num(payload.yearBuilt),
                      propertySize: num(payload.propertySize),
                      listPrice: num(payload.listPrice),
                      bedrooms: strOrNull(payload.bedrooms),
                      bathrooms: strOrNull(payload.bathrooms),
                      featuresText: strOrNull(payload.featuresText),
                      description: strOrNull(payload.description),
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
                    <label className="field-label">
                      Property Address
                    </label>
                    <PlacesAddressInput
                      name="propertyAddress"
                      defaultValue={order.propertyAddress}
                      defaultFormattedAddress={
                        order.propertyFormattedAddress ?? order.propertyAddress
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
                  {/* Public display override fields */}
                  <div className="sm:col-span-2 mt-4">
                    <div className="field-label">
                      Public display overrides (optional)
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="field-label">
                          Override Street Address
                        </label>
                        <input
                          name="propertyAddressOverride"
                          defaultValue={order.propertyAddressOverride ?? ''}
                          className="field"
                          placeholder="e.g., 123A Main St, Unit 402"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="field-label">
                            Override City
                          </label>
                          <input
                            name="propertyCityOverride"
                            defaultValue={order.propertyCityOverride ?? ''}
                            className="field"
                            placeholder="e.g., Springfield"
                          />
                        </div>
                        <div>
                          <label className="field-label">
                            Override Postal Code
                          </label>
                          <input
                            name="propertyPostalCodeOverride"
                            defaultValue={
                              order.propertyPostalCodeOverride ?? ''
                            }
                            className="field"
                            placeholder="e.g., 12345"
                          />
                        </div>
                      </div>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        These override only the address text shown on the public
                        property page hero. Map/coordinates remain unchanged.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="field-label">MLS #</label>
                    <input
                      name="mlsNumber"
                      defaultValue={order.mlsNumber ?? ''}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="field-label">Year Built</label>
                    <input
                      type="number"
                      name="yearBuilt"
                      defaultValue={order.yearBuilt ?? ''}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="field-label">Size (sqft)</label>
                    <input
                      type="number"
                      name="propertySize"
                      defaultValue={order.propertySize ?? ''}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="field-label">List Price</label>
                    <input
                      type="number"
                      name="listPrice"
                      defaultValue={order.listPrice ?? ''}
                      className="field"
                    />
                  </div>
                  <div>
                    <label className="field-label">Bedrooms</label>

                    <input
                      type="text"
                      name="bedrooms"
                      defaultValue={order.bedrooms ?? ''}
                      className="field"
                      placeholder="e.g., 2+1"
                    />
                  </div>
                  <div>
                    <label className="field-label">Bathrooms</label>
                    <input
                      type="text"
                      name="bathrooms"
                      defaultValue={order.bathrooms ?? ''}
                      className="field"
                      placeholder="e.g., 2.5 or 2+2"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">Description</label>
                    <DescriptionEditor
                      name="description"
                      defaultValue={order.description ?? ''}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">
                      Features (one per line)
                    </label>
                    <textarea
                      name="featuresText"
                      defaultValue={order.featuresText ?? ''}
                      className="field"
                      placeholder={
                        'E.g.\nQuartz countertops\nHardwood floors\nSouth-facing backyard'
                      }
                    />
                  </div>
                  <div>
                    <label className="field-label">Status</label>
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="field"
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
                    <Button type="submit" className="btn-navy">
                      Save
                    </Button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex justify-end border-t border-border pt-4">
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex h-8 items-center gap-2 rounded-full border border-border px-4 text-[13px] font-semibold hover:border-navy-600 hover:bg-surface-2"
                >
                  Edit
                </button>
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
            <AttachmentsList orderId={order.id} refreshToken={attachRefresh} />
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

        {tab === 'qr' && order && (
          <div className="space-y-4">
            <OrderQRCodes orderId={order.id} />
          </div>
        )}
      </div>
      <Toaster />
    </div>
  );
}

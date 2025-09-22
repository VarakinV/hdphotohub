import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Download, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { CopyButton } from '@/components/common/CopyButton';
import { headers } from 'next/headers';

import { PhotosZipDownloader } from '@/components/delivery/PhotosZipDownloader';
import { DownloadLinkButton } from '@/components/delivery/DownloadLinkButton';
import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';

async function getOrder(id: string) {
  const order = await prisma.order.findFirst({
    where: { id, status: 'PUBLISHED' },
    include: {
      realtor: true,
      photos: true,
      videos: true,
      floorPlans: true,
      attachments: true,
      embeds: true,
      propertyPages: true,
    },
  });
  return order;
}

export default async function DeliveryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`;
  const hdrs = await headers();
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto =
    hdrs.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');
  const publicUrl = `${baseUrl}/delivery/${order.id}`;
  const photoItems = order.photos.map((pp) => ({
    src: pp.urlMls || pp.url,
    alt: pp.filename,
  }));

  const floorPlanItems = order.floorPlans.map((fp) => ({
    src: fp.url,
    alt: fp.filename,
  }));

  const heroUrl: string | null =
    order.photos[0]?.url ?? order.photos[0]?.urlMls ?? null;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <section className="relative isolate min-h-[46vh]">
        {/* Background image */}
        {heroUrl ? (
          <Image
            src={heroUrl}
            alt="Property hero"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 py-10 md:py-16">
          {/* Top-right copy link */}
          <div className="absolute right-4 top-4">
            <CopyButton text={publicUrl} label="Copy Link" size="lg" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 items-center">
            {/* Left: Realtor info */}
            <div className="flex items-center gap-4 text-white">
              {order.realtor.headshot && (
                <Image
                  src={order.realtor.headshot}
                  alt={realtorName}
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <div className="text-lg md:text-xl font-semibold">
                  {realtorName}
                </div>
                <div className="text-sm text-gray-200/90">
                  {order.realtor.email}
                </div>
                {order.realtor.phone && (
                  <div className="text-sm text-gray-200/90">
                    <a
                      href={`tel:${order.realtor.phone}`}
                      className="underline decoration-white/30 hover:decoration-white"
                    >
                      {order.realtor.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
            {/* Right: Address */}
            <div className="text-right">
              <h1 className="text-white text-4xl md:text-6xl font-semibold leading-tight">
                {order.propertyAddress}
              </h1>
            </div>
          </div>

          {/* Primary actions */}
          <div className="mt-6 flex flex-wrap items-center gap-6">
            <div className="flex flex-col gap-2">
              <div className="text-white/95 text-2xl md:text-3xl font-semibold">
                Download All Photos
              </div>
              <PhotosZipDownloader orderId={order.id} size="lg" />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl p-4 space-y-12 mt-8 md:mt-12">
        {/* Individual Photos */}
        {!!order.photos.length && (
          <section id="photos" className="space-y-3 scroll-mt-24">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold">Photos</h2>
              <div className="h-px bg-gray-200/80" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {order.photos.map((p) => (
                <div key={p.id} className="border rounded-md overflow-hidden">
                  <PhotoLightbox
                    src={p.urlMls || p.url}
                    alt={p.filename}
                    items={photoItems}
                    startIndex={order.photos.findIndex((x) => x.id === p.id)}
                  />
                  <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x">
                    <div className="sm:flex-1 p-2 text-center">
                      <DownloadLinkButton
                        url={`/api/delivery/photo/${
                          p.id
                        }?variant=original&filename=${encodeURIComponent(
                          p.filename
                        )}`}
                        label="Original Size"
                        fileName={p.filename}
                      />
                    </div>
                    <div className="sm:flex-1 p-2 text-center">
                      <DownloadLinkButton
                        url={`/api/delivery/photo/${
                          p.id
                        }?variant=mls&filename=${encodeURIComponent(
                          p.filename.replace(/\.[^.]+$/, '') + '-mls.jpg'
                        )}`}
                        label="MLS"
                        fileName={
                          p.filename.replace(/\.[^.]+$/, '') + '-mls.jpg'
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Videos */}
        {!!order.videos.length && (
          <section id="videos" className="space-y-3 scroll-mt-24">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold">Videos</h2>
              <div className="h-px bg-gray-200/80" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {order.videos.map((v) => (
                <div key={v.id} className="border rounded-md overflow-hidden">
                  <video controls className="w-full h-32 object-cover">
                    <source src={v.url} type="video/mp4" />
                  </video>
                  <div className="p-2 text-center">
                    <DownloadLinkButton
                      url={v.url}
                      label="Download"
                      fileName={
                        (v as any).filename ??
                        (v.url.split('/').pop() || 'video.mp4')
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Floor Plans */}
        {!!order.floorPlans.length && (
          <section id="floor-plans" className="space-y-3 scroll-mt-24">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold">
                Floor Plans
              </h2>
              <div className="h-px bg-gray-200/80" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {order.floorPlans.map((f) => (
                <div key={f.id} className="border rounded-md overflow-hidden">
                  <PhotoLightbox
                    src={f.url}
                    alt={f.filename}
                    items={floorPlanItems}
                    startIndex={order.floorPlans.findIndex(
                      (x) => x.id === f.id
                    )}
                  />
                  <div className="p-2 text-center">
                    <DownloadLinkButton
                      url={f.url}
                      label="Download"
                      fileName={f.filename}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attachments */}
        {!!order.attachments.length && (
          <section id="attachments" className="space-y-3 scroll-mt-24">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold">
                Attachments
              </h2>
              <div className="h-px bg-gray-200/80" />
            </div>
            <div className="space-y-2">
              {order.attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border rounded-md p-2"
                >
                  <div className="truncate sm:mr-4">{a.filename}</div>
                  <div className="sm:flex-shrink-0">
                    <DownloadLinkButton
                      url={a.url}
                      label="Download"
                      fileName={a.filename}
                      fullWidth={false}
                      className="w-full sm:w-auto"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Embeds */}
        {!!order.embeds.length && (
          <section className="space-y-3">
            <div className="space-y-2">
              <h2 className="text-2xl md:text-3xl font-semibold">
                Tours & Embeds
              </h2>
              <div className="h-px bg-gray-200/80" />
            </div>
            <div className="space-y-3">
              {order.embeds.map((e) => (
                <div key={e.id} className="border rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium truncate mr-4">{e.title}</div>
                    <CopyButton text={e.embedUrl} label="Copy Link" />
                  </div>
                  <div className="aspect-video bg-black/5 rounded overflow-hidden">
                    <iframe
                      src={e.embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                      loading="lazy"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Property Websites */}
        <section id="property-sites" className="space-y-3 scroll-mt-24">
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Property Websites
            </h2>
            <div className="h-px bg-gray-200/80" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((v) => {
              const url = `${baseUrl}/property/${order.id}/v${v}`;
              return (
                <div key={v} className="border rounded-md overflow-hidden">
                  <div className="px-3 py-2 text-sm font-medium bg-gray-50 border-b">
                    Variant {v}
                  </div>

                  <div className="aspect-video bg-black/5 relative">
                    {heroUrl ? (
                      <Image
                        src={heroUrl}
                        alt={`Template v${v}`}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No preview
                      </div>
                    )}
                  </div>
                  <div className="p-3 flex items-center justify-between">
                    <Button
                      asChild
                      variant="secondary"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Link href={url} target="_blank">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </Link>
                    </Button>
                    <CopyButton
                      text={url}
                      label="Copy Public Link"
                      icon={<Copy className="w-4 h-4 mr-2" />}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <div className="text-xs text-gray-500 text-center py-6">
          Powered by Photos 4 Real Estate
        </div>
      </main>
    </div>
  );
}

import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { CopyButton } from '@/components/common/CopyButton';

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
  const publicUrl = `/delivery/${order.id}`;
  const photoItems = order.photos.map((pp) => ({
    src: pp.urlMls || pp.url,
    alt: pp.filename,
  }));

  return (
    <div className="mx-auto max-w-6xl p-4 space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        {order.realtor.headshot && (
          <Image
            src={order.realtor.headshot}
            alt={realtorName}
            width={64}
            height={64}
            className="rounded-full object-cover"
          />
        )}
        <div className="flex-1">
          <div className="text-lg font-semibold">{realtorName}</div>
          <div className="text-sm text-gray-500">{order.realtor.email}</div>
          <div className="text-xl mt-2 font-semibold">
            {order.propertyAddress}
          </div>
        </div>
        <CopyButton text={publicUrl} label="Copy Link" />
      </div>

      {/* Downloads - All Photos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Download All Photos</h2>
        <PhotosZipDownloader orderId={order.id} />
      </section>

      {/* Individual Photos */}
      {!!order.photos.length && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Photos</h2>
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
                      fileName={p.filename.replace(/\.[^.]+$/, '') + '-mls.jpg'}
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
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Videos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {order.videos.map((v) => (
              <div key={v.id} className="border rounded-md overflow-hidden">
                <video controls className="w-full h-32 object-cover">
                  <source src={v.url} type="video/mp4" />
                </video>
                <div className="p-2 text-center">
                  <Button asChild size="sm" variant="outline">
                    <Link href={v.url} target="_blank">
                      <Download className="h-4 w-4" /> Download
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Floor Plans */}
      {!!order.floorPlans.length && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Floor Plans</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {order.floorPlans.map((f) => (
              <div key={f.id} className="border rounded-md overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={f.url}
                  alt={f.filename}
                  className="w-full h-32 object-cover"
                  loading="lazy"
                />
                <div className="p-2 text-center">
                  <Button asChild size="sm" variant="outline">
                    <Link href={f.url} target="_blank">
                      <Download className="h-4 w-4" /> Download
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Attachments */}
      {!!order.attachments.length && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Attachments</h2>
          <div className="space-y-2">
            {order.attachments.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between border rounded-md p-2"
              >
                <div className="truncate mr-4">{a.filename}</div>
                <Button asChild size="sm" variant="outline">
                  <Link href={a.url} target="_blank">
                    <Download className="h-4 w-4" /> Download
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Embeds */}
      {!!order.embeds.length && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Tours & Embeds</h2>
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

      <div className="text-xs text-gray-500 text-center py-6">
        Powered by Photos 4 Real Estate
      </div>
    </div>
  );
}

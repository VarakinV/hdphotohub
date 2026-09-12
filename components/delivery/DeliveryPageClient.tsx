'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Copy, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/common/CopyButton';
import { PhotosZipDownloader } from '@/components/delivery/PhotosZipDownloader';
import { DownloadLinkButton } from '@/components/delivery/DownloadLinkButton';
import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';
import { VideoWithPoster } from '@/components/delivery/VideoWithPoster';
import { SitePreview } from '@/components/delivery/SitePreview';
import {
  DeliverySection,
  MoreTile,
  ViewAllButton,
} from '@/components/delivery/DeliverySection';
import {
  DeliveryDesktopNav,
  DeliveryMobileNav,
} from '@/components/delivery/DeliveryNav';
import type {
  DeliveryNavItem,
  DeliveryPageData,
  DeliveryPhoto,
} from '@/components/delivery/types';

const PREVIEW = {
  photos: 7,
  videos: 2,
  floorPlans: 4,
  attachments: 4,
  reels: 5,
  aiReels: 2,
  slideshows: 2,
  socialPosts: 4,
  flyers: 3,
  websites: 3,
  qr: 3,
} as const;

const CORE_DEFAULT_OPEN = new Set([
  'photos',
  'videos',
  'floor-plans',
  'attachments',
  'tours',
]);

function visibleSlice<T>(items: T[], limit: number, showAll: boolean) {
  return showAll ? items : items.slice(0, limit);
}

function photoDownloads(p: DeliveryPhoto) {
  return [
    {
      label: 'Original',
      url: `/api/delivery/photo/${p.id}?variant=original&filename=${encodeURIComponent(p.filename)}`,
      fileName: p.filename,
    },
    {
      label: 'MLS',
      url: `/api/delivery/photo/${p.id}?variant=mls&filename=${encodeURIComponent(p.filename.replace(/\.[^.]+$/, '') + '-mls.jpg')}`,
      fileName: p.filename.replace(/\.[^.]+$/, '') + '-mls.jpg',
    },
  ];
}

export function DeliveryPageClient({ data }: { data: DeliveryPageData }) {
  const {
    orderId,
    publicUrl,
    addressLine,
    cityLine,
    heroUrl,
    realtor,
    photos,
    videos,
    reels,
    aiReels,
    slideshows,
    socialPosts,
    floorPlans,
    attachments,
    embeds,
    flyers,
    websites,
    qrPrintables,
  } = data;

  const realtorName = `${realtor.firstName} ${realtor.lastName}`;
  const photoItems = photos.map((p) => ({
    src: p.urlMls || p.url,
    alt: p.filename,
    downloads: photoDownloads(p),
  }));
  const floorPlanItems = floorPlans.map((fp) => ({
    src: fp.url,
    alt: fp.filename,
    downloads: [{ label: 'Download', url: fp.url, fileName: fp.filename }],
  }));

  const coreNav: DeliveryNavItem[] = useMemo(() => {
    const items: DeliveryNavItem[] = [];
    if (photos.length) items.push({ id: 'photos', label: 'Photos', count: photos.length });
    if (videos.length) items.push({ id: 'videos', label: videos.length === 1 ? 'Video' : 'Videos', count: videos.length });
    if (floorPlans.length) items.push({ id: 'floor-plans', label: 'Floor plans', count: floorPlans.length });
    if (attachments.length) items.push({ id: 'attachments', label: 'Attachments', count: attachments.length });
    if (embeds.length) items.push({ id: 'tours', label: 'Virtual tour', count: embeds.length });
    return items;
  }, [photos.length, videos.length, floorPlans.length, attachments.length, embeds.length]);

  const kitNav: DeliveryNavItem[] = useMemo(() => {
    const items: DeliveryNavItem[] = [];
    if (reels.length) items.push({ id: 'reels', label: 'Social reels', count: reels.length });
    if (aiReels.length) items.push({ id: 'ai-reels', label: 'Bonus AI reel', count: aiReels.length });
    if (slideshows.length) items.push({ id: 'slideshows', label: 'Slideshows', count: slideshows.length });
    if (socialPosts.length) items.push({ id: 'social-posts', label: 'Social posts', count: socialPosts.length });
    if (flyers.length) items.push({ id: 'property-flyers', label: 'Flyers', count: flyers.length });
    if (websites.length) items.push({ id: 'property-sites', label: 'Websites', count: websites.length });
    if (qrPrintables.length) items.push({ id: 'qr-codes', label: 'QR codes', count: qrPrintables.length });
    return items;
  }, [
    reels.length,
    aiReels.length,
    slideshows.length,
    socialPosts.length,
    flyers.length,
    websites.length,
    qrPrintables.length,
  ]);

  const mobileNav = useMemo(
    () => [
      ...coreNav,
      ...(kitNav.length ? [{ id: 'marketing-kit', label: 'Marketing kit' }] : []),
      ...kitNav,
    ],
    [coreNav, kitNav]
  );

  const allSectionIds = useMemo(
    () => [...coreNav.map((i) => i.id), 'marketing-kit', ...kitNav.map((i) => i.id)],
    [coreNav, kitNav]
  );

  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const id of CORE_DEFAULT_OPEN) initial[id] = true;
    return initial;
  });
  const [showAll, setShowAll] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(coreNav[0]?.id ?? 'photos');

  const toggleOpen = useCallback((id: string) => {
    setOpen((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleShowAll = useCallback((id: string) => {
    setShowAll((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const navigateTo = useCallback((id: string) => {
    setOpen((prev) => ({ ...prev, [id]: true }));
    window.history.replaceState(null, '', `#${id}`);
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, []);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return;
    setOpen((prev) => ({ ...prev, [hash]: true }));
    window.setTimeout(() => {
      document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }, []);

  useEffect(() => {
    const els = allSectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) setActiveId(visible[0].target.id);
      },
      { rootMargin: '-18% 0px -68% 0px', threshold: [0, 0.15, 0.4, 0.7] }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [allSectionIds]);

  const photosOpen = !!open.photos;
  const photosAll = !!showAll.photos;
  const visiblePhotos = visibleSlice(photos, PREVIEW.photos, photosAll);
  const photoRemaining = photos.length - PREVIEW.photos;

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="mx-auto w-full max-w-6xl px-4 pt-6 lg:max-w-[86rem] lg:px-6">
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] lg:grid lg:grid-cols-2">
          <div className="relative min-h-[240px] aspect-[4/3] lg:aspect-auto lg:min-h-[420px]">
            {heroUrl ? (
              <Image
                src={heroUrl}
                alt="Property hero"
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-navy-900" />
            )}
          </div>

          <div className="relative flex flex-col p-6 md:p-8 lg:p-10">
            <div className="absolute right-4 top-4">
              <CopyButton text={publicUrl} label="Copy Link" size="sm" />
            </div>

            <h1 className="pr-24 font-[family-name:var(--font-space-grotesk)] text-3xl font-semibold leading-tight text-navy-900 md:text-4xl lg:text-5xl">
              {addressLine}
            </h1>
            {cityLine && (
              <p className="mt-2 text-[15px] text-gray-500">{cityLine}</p>
            )}

            <div className="mt-6 flex items-center gap-3">
              {realtor.headshot && (
                <Image
                  src={realtor.headshot}
                  alt={realtorName}
                  width={48}
                  height={48}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <div className="text-[15px] font-semibold text-navy-900">{realtorName}</div>
                {realtor.phone && (
                  <a href={`tel:${realtor.phone}`} className="text-[15px] text-gray-500 hover:text-navy-900">
                    {realtor.phone}
                  </a>
                )}
                {!realtor.phone && (
                  <div className="text-[15px] text-gray-500">{realtor.email}</div>
                )}
              </div>
            </div>

            <div className="mt-auto pt-8">
              {photos.length > 0 && (
                <PhotosZipDownloader
                  orderId={orderId}
                  photos={photos}
                  appearance="hero"
                />
              )}
            </div>
          </div>
        </div>
      </section>

      <DeliveryMobileNav
        items={mobileNav}
        activeId={activeId}
        onNavigate={navigateTo}
      />

      <div className="mx-auto w-full max-w-6xl px-4 py-8 lg:max-w-[86rem] lg:px-6 lg:py-10">
        <div className="lg:grid lg:grid-cols-[12.5rem_minmax(0,72rem)] lg:justify-center lg:gap-8">
          <DeliveryDesktopNav
            core={coreNav}
            kit={kitNav}
            activeId={activeId}
            onNavigate={navigateTo}
          />

          <div className="min-w-0 space-y-5">
            {photos.length > 0 && (
              <DeliverySection
                id="photos"
                title="Photos"
                description="Professionally edited property photos. Download originals for print and MLS-size versions for web listings."
                count={photos.length}
                open={photosOpen}
                onToggle={() => toggleOpen('photos')}
                headerActions={
                  <PhotosZipDownloader
                    orderId={orderId}
                    photos={photos}
                    appearance="section"
                  />
                }
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {visiblePhotos.map((p, index) => (
                      <div key={p.id} className="overflow-hidden rounded-xl border border-gray-100">
                        <PhotoLightbox
                          src={p.urlMls || p.url}
                          alt={p.filename}
                          items={photoItems}
                          startIndex={index}
                          overlayLabel={String(index + 1).padStart(2, '0')}
                          thumbClassName="w-full aspect-[4/3] object-cover cursor-pointer"
                        />
                        <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x">
                          <div className="sm:flex-1 p-2 text-center">
                            <DownloadLinkButton
                              url={`/api/delivery/photo/${p.id}?variant=original&filename=${encodeURIComponent(p.filename)}`}
                              label="Original Size"
                              fileName={p.filename}
                            />
                          </div>
                          <div className="sm:flex-1 p-2 text-center">
                            <DownloadLinkButton
                              url={`/api/delivery/photo/${p.id}?variant=mls&filename=${encodeURIComponent(p.filename.replace(/\.[^.]+$/, '') + '-mls.jpg')}`}
                              label="MLS"
                              fileName={p.filename.replace(/\.[^.]+$/, '') + '-mls.jpg'}
                            />
                          </div>
                        </div>
                      </div>
                  ))}
                  {!photosAll && photoRemaining > 0 && (
                    <MoreTile
                      remaining={photoRemaining}
                      onClick={() => toggleShowAll('photos')}
                      className="aspect-[4/3]"
                    />
                  )}
                </div>
                {photosAll && photoRemaining > 0 && (
                  <ViewAllButton
                    total={photos.length}
                    noun="photos"
                    expanded
                    onClick={() => toggleShowAll('photos')}
                  />
                )}
              </DeliverySection>
            )}

            {videos.length > 0 && (
              <DeliverySection
                id="videos"
                title={videos.length === 1 ? 'Video' : 'Videos'}
                description="Raw video walkthroughs of the property. Download or share the public link as needed."
                count={videos.length}
                open={!!open.videos}
                onToggle={() => toggleOpen('videos')}
              >
                <VideoGrid
                  videos={videos}
                  showAll={!!showAll.videos}
                  onToggleShowAll={() => toggleShowAll('videos')}
                />
              </DeliverySection>
            )}

            {floorPlans.length > 0 && (
              <DeliverySection
                id="floor-plans"
                title="Floor plans"
                description="Downloadable floor plans for the listing. Click any image to view it full-size."
                count={floorPlans.length}
                open={!!open['floor-plans']}
                onToggle={() => toggleOpen('floor-plans')}
              >
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {visibleSlice(floorPlans, PREVIEW.floorPlans, !!showAll['floor-plans']).map(
                    (f) => (
                      <div key={f.id} className="overflow-hidden rounded-xl border border-gray-100">
                        <PhotoLightbox
                          src={f.url}
                          alt={f.filename}
                          items={floorPlanItems}
                          startIndex={floorPlans.findIndex((x) => x.id === f.id)}
                          thumbClassName="w-full aspect-[4/3] object-contain bg-white cursor-pointer"
                        />
                        <div className="p-2">
                          <DownloadLinkButton url={f.url} label="Download" fileName={f.filename} />
                        </div>
                      </div>
                    )
                  )}
                </div>
                {floorPlans.length > PREVIEW.floorPlans && (
                  <ViewAllButton
                    total={floorPlans.length}
                    noun="floor plans"
                    expanded={!!showAll['floor-plans']}
                    onClick={() => toggleShowAll('floor-plans')}
                  />
                )}
              </DeliverySection>
            )}

            {attachments.length > 0 && (
              <DeliverySection
                id="attachments"
                title="Attachments"
                description="Additional PDFs and documents provided with this listing."
                count={attachments.length}
                open={!!open.attachments}
                onToggle={() => toggleOpen('attachments')}
              >
                <div className="space-y-2">
                  {visibleSlice(
                    attachments,
                    PREVIEW.attachments,
                    !!showAll.attachments
                  ).map((a) => (
                    <div
                      key={a.id}
                      className="flex flex-col gap-2 rounded-xl border border-gray-100 p-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="truncate sm:mr-4 text-[15px] text-navy-900">{a.filename}</div>
                      <DownloadLinkButton
                        url={a.url}
                        label="Download"
                        fileName={a.filename}
                        fullWidth={false}
                        className="w-full sm:w-auto"
                      />
                    </div>
                  ))}
                </div>
                {attachments.length > PREVIEW.attachments && (
                  <ViewAllButton
                    total={attachments.length}
                    noun="attachments"
                    expanded={!!showAll.attachments}
                    onClick={() => toggleShowAll('attachments')}
                  />
                )}
              </DeliverySection>
            )}

            {embeds.length > 0 && (
              <DeliverySection
                id="tours"
                title="Tours & Embeds"
                description="Interactive 3D tours and iGUIDE walkthroughs embedded directly for the buyer."
                count={embeds.length}
                open={!!open.tours}
                onToggle={() => toggleOpen('tours')}
              >
                <div className="space-y-3">
                  {embeds.map((e) => (
                    <EmbedCard key={e.id} title={e.title} embedUrl={e.embedUrl} />
                  ))}
                </div>
              </DeliverySection>
            )}

            {kitNav.length > 0 && (
              <div className="pt-6">
                <div
                  id="marketing-kit"
                  className="mb-4 scroll-mt-20 text-center lg:scroll-mt-8"
                >
                  <h2 className="text-3xl font-semibold text-navy-900 md:text-4xl">
                    Marketing kit
                  </h2>
                  <p className="mx-auto mt-2 max-w-xl text-[15px] text-gray-500 md:text-base">
                    Social-ready assets built from this shoot — reels, flyers, listing sites and QR signage.
                    Each section below opens to show everything inside it.
                  </p>
                </div>

                <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
                  {reels.length > 0 && (
                    <DeliverySection
                      id="reels"
                      title="Social media reels"
                      description="Vertical short-form videos (9:16) ready for Instagram Reels, TikTok, and YouTube Shorts."
                      count={reels.length}
                      open={!!open.reels}
                      onToggle={() => toggleOpen('reels')}
                      previewThumbs={reels.map((r) => r.thumbnail || heroUrl || '')}
                      variant="flush"
                    >
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {visibleSlice(reels, PREVIEW.reels, !!showAll.reels).map((r) => (
                          <ReelCard
                            key={r.id}
                            url={r.url}
                            thumbnail={r.thumbnail}
                            fallback={heroUrl}
                            label={r.label}
                            fileName={`reel-${r.variantKey}.mp4`}
                            aspect="9/16"
                          />
                        ))}
                      </div>
                      {reels.length > PREVIEW.reels && (
                        <ViewAllButton
                          total={reels.length}
                          noun="reels"
                          expanded={!!showAll.reels}
                          onClick={() => toggleShowAll('reels')}
                        />
                      )}
                    </DeliverySection>
                  )}

                  {aiReels.length > 0 && (
                    <div className="border-t border-gray-100">
                      <DeliverySection
                        id="ai-reels"
                        title="Bonus AI Reel"
                        description="AI-stylized twilight reel — a creative bonus version for standout social posts."
                        count={aiReels.length}
                        open={!!open['ai-reels']}
                        onToggle={() => toggleOpen('ai-reels')}
                        previewThumbs={aiReels.map((r) => r.thumbnail || heroUrl || '')}
                        variant="flush"
                      >
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {visibleSlice(aiReels, PREVIEW.aiReels, !!showAll['ai-reels']).map(
                            (r) => (
                              <ReelCard
                                key={r.id}
                                url={r.finalUrl}
                                thumbnail={r.thumbnail}
                                fallback={heroUrl}
                                label={r.label}
                                fileName={`${r.label.toLowerCase().replace(/\s+/g, '-')}.mp4`}
                                aspect="9/16"
                              />
                            )
                          )}
                        </div>
                        {aiReels.length > PREVIEW.aiReels && (
                          <ViewAllButton
                            total={aiReels.length}
                            noun="AI reels"
                            expanded={!!showAll['ai-reels']}
                            onClick={() => toggleShowAll('ai-reels')}
                          />
                        )}
                      </DeliverySection>
                    </div>
                  )}

                  {slideshows.length > 0 && (
                    <div className="border-t border-gray-100">
                      <DeliverySection
                        id="slideshows"
                        title="Slideshows"
                        description="Horizontal (16:9) slideshows optimized for YouTube, your property website, and big-screen presentations."
                        count={slideshows.length}
                        open={!!open.slideshows}
                        onToggle={() => toggleOpen('slideshows')}
                        previewThumbs={slideshows.map((r) => r.thumbnail || heroUrl || '')}
                        variant="flush"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          {visibleSlice(
                            slideshows,
                            PREVIEW.slideshows,
                            !!showAll.slideshows
                          ).map((r) => (
                            <ReelCard
                              key={r.id}
                              url={r.url}
                              thumbnail={r.thumbnail}
                              fallback={heroUrl}
                              label={r.label}
                              fileName={`slideshow-${r.variantKey}.mp4`}
                              aspect="16/9"
                            />
                          ))}
                        </div>
                        {slideshows.length > PREVIEW.slideshows && (
                          <ViewAllButton
                            total={slideshows.length}
                            noun="slideshows"
                            expanded={!!showAll.slideshows}
                            onClick={() => toggleShowAll('slideshows')}
                          />
                        )}
                      </DeliverySection>
                    </div>
                  )}

                  {socialPosts.length > 0 && (
                    <div className="border-t border-gray-100">
                      <DeliverySection
                        id="social-posts"
                        title="Social media posts"
                        description="Ready-to-post stills (1080×1350, 4:5) for Instagram, Facebook, and LinkedIn."
                        count={socialPosts.length}
                        open={!!open['social-posts']}
                        onToggle={() => toggleOpen('social-posts')}
                        previewThumbs={socialPosts.map((p) => p.url)}
                        variant="flush"
                      >
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                          {visibleSlice(
                            socialPosts,
                            PREVIEW.socialPosts,
                            !!showAll['social-posts']
                          ).map((p) => (
                            <div
                              key={p.id}
                              className="overflow-hidden rounded-xl border border-gray-100 bg-white"
                            >
                              <div className="relative aspect-[4/5] bg-gray-100">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p.url}
                                  alt={p.caption}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="truncate px-3 pt-2 text-[15px] text-gray-600">
                                {p.caption}
                              </div>
                              <div className="p-3">
                                <DownloadLinkButton
                                  url={p.url}
                                  label="Download"
                                  fileName={`social-${p.variantKey}.png`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {socialPosts.length > PREVIEW.socialPosts && (
                          <ViewAllButton
                            total={socialPosts.length}
                            noun="posts"
                            expanded={!!showAll['social-posts']}
                            onClick={() => toggleShowAll('social-posts')}
                          />
                        )}
                      </DeliverySection>
                    </div>
                  )}

                  {flyers.length > 0 && (
                    <div className="border-t border-gray-100">
                      <DeliverySection
                        id="property-flyers"
                        title="Property flyers"
                        description="Printable PDF flyers — hand out at open houses or pin to the yard sign."
                        count={flyers.length}
                        open={!!open['property-flyers']}
                        onToggle={() => toggleOpen('property-flyers')}
                        previewThumbs={flyers.map((f) => f.previewUrl || heroUrl || '')}
                        variant="flush"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          {visibleSlice(
                            flyers,
                            PREVIEW.flyers,
                            !!showAll['property-flyers']
                          ).map((f) => (
                            <div
                              key={f.id}
                              className="overflow-hidden rounded-xl border border-gray-100"
                            >
                              <div className="relative aspect-[8.5/11] bg-gray-50">
                                {f.previewUrl || heroUrl ? (
                                  <Image
                                    src={f.previewUrl || heroUrl!}
                                    alt="Flyer preview"
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full items-center justify-center text-gray-400">
                                    No preview
                                  </div>
                                )}
                              </div>
                              <div className="p-3">
                                <DownloadLinkButton
                                  url={f.url}
                                  label="Download PDF"
                                  fileName={`flyer-${f.variantKey}.pdf`}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {flyers.length > PREVIEW.flyers && (
                          <ViewAllButton
                            total={flyers.length}
                            noun="flyers"
                            expanded={!!showAll['property-flyers']}
                            onClick={() => toggleShowAll('property-flyers')}
                          />
                        )}
                      </DeliverySection>
                    </div>
                  )}

                  {websites.length > 0 && (
                    <div className="border-t border-gray-100">
                      <DeliverySection
                        id="property-sites"
                        title="Property websites"
                        description="Standalone single-property websites with their own URL. Open or share the link with buyers."
                        count={websites.length}
                        open={!!open['property-sites']}
                        onToggle={() => toggleOpen('property-sites')}
                        previewThumbs={heroUrl ? [heroUrl] : []}
                        variant="flush"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          {visibleSlice(
                            websites,
                            PREVIEW.websites,
                            !!showAll['property-sites']
                          ).map((site) => (
                            <div
                              key={site.variant}
                              className="overflow-hidden rounded-xl border border-gray-100"
                            >
                              <div className="border-b bg-gray-50 px-3 py-2 text-[15px] font-medium text-navy-900">
                                {site.name}
                              </div>
                              {open['property-sites'] ? (
                                <SitePreview
                                  src={site.previewSrc}
                                  title={`Property Website ${site.name}`}
                                />
                              ) : null}
                              <div className="flex items-center justify-between p-3">
                                <Button asChild variant="secondary" size="sm">
                                  <Link href={site.url} target="_blank">
                                    <ExternalLink className="mr-1 h-4 w-4" />
                                    Open
                                  </Link>
                                </Button>
                                <CopyButton
                                  text={site.url}
                                  label="Copy Link"
                                  size="sm"
                                  icon={<Copy className="h-4 w-4" />}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        {websites.length > PREVIEW.websites && (
                          <ViewAllButton
                            total={websites.length}
                            noun="websites"
                            expanded={!!showAll['property-sites']}
                            onClick={() => toggleShowAll('property-sites')}
                          />
                        )}
                      </DeliverySection>
                    </div>
                  )}

                  {qrPrintables.length > 0 && (
                    <div className="border-t border-gray-100">
                      <DeliverySection
                        id="qr-codes"
                        title="Lead capture QR codes"
                        description="Download and print these as a sign rider or decal for your yard sign. When a buyer scans it, they can view the property instantly or leave their contact info."
                        count={qrPrintables.length}
                        open={!!open['qr-codes']}
                        onToggle={() => toggleOpen('qr-codes')}
                        previewThumbs={qrPrintables.map((p) => p.pngUrl || '')}
                        variant="flush"
                      >
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                          {visibleSlice(
                            qrPrintables,
                            PREVIEW.qr,
                            !!showAll['qr-codes']
                          ).map((p) => (
                            <div
                              key={p.id}
                              className="overflow-hidden rounded-xl border border-gray-100"
                            >
                              <div className="border-b bg-gray-50 px-3 py-2 text-[15px] font-medium text-navy-900">
                                {p.label}
                              </div>
                              <div className="relative flex aspect-square items-center justify-center bg-white p-4">
                                {p.pngUrl ? (
                                  <Image
                                    src={p.pngUrl}
                                    alt={p.label}
                                    fill
                                    className="object-contain"
                                  />
                                ) : (
                                  <div className="text-sm text-gray-400">No preview</div>
                                )}
                              </div>
                              <div className="flex flex-col divide-y sm:flex-row sm:divide-x sm:divide-y-0">
                                {p.pngUrl && (
                                  <div className="flex-1 p-2">
                                    <DownloadLinkButton
                                      url={p.pngUrl}
                                      label="PNG"
                                      fileName={`qr-${p.displayId}-${p.variantKey}.png`}
                                    />
                                  </div>
                                )}
                                {p.pdfUrl && (
                                  <div className="flex-1 p-2">
                                    <DownloadLinkButton
                                      url={p.pdfUrl}
                                      label="PDF"
                                      fileName={`qr-${p.displayId}-${p.variantKey}.pdf`}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        {qrPrintables.length > PREVIEW.qr && (
                          <ViewAllButton
                            total={qrPrintables.length}
                            noun="QR codes"
                            expanded={!!showAll['qr-codes']}
                            onClick={() => toggleShowAll('qr-codes')}
                          />
                        )}
                      </DeliverySection>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="py-6 text-center text-sm text-gray-500">
              Powered by Photos 4 Real Estate
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function VideoGrid({
  videos,
  showAll,
  onToggleShowAll,
}: {
  videos: DeliveryPageData['videos'];
  showAll: boolean;
  onToggleShowAll: () => void;
}) {
  const visible = visibleSlice(videos, PREVIEW.videos, showAll);
  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {visible.map((v) => (
          <div key={v.id} className="overflow-hidden rounded-xl border border-gray-100">
            <div className="aspect-video bg-black">
              <video controls className="h-full w-full object-contain">
                <source src={v.url} type="video/mp4" />
              </video>
            </div>
            <div className="flex gap-2 p-3">
              <DownloadLinkButton
                url={v.url}
                label="Download"
                fileName={v.filename}
                className="flex-1"
              />
              <CopyButton
                text={v.url}
                label="Copy Link"
                copiedLabel="Copied!"
                size="sm"
                icon={<Copy className="h-4 w-4" />}
                className="flex-1"
              />
            </div>
          </div>
        ))}
      </div>
      {videos.length > PREVIEW.videos && (
        <ViewAllButton
          total={videos.length}
          noun="videos"
          expanded={showAll}
          onClick={onToggleShowAll}
        />
      )}
    </>
  );
}

function ReelCard({
  url,
  thumbnail,
  fallback,
  label,
  fileName,
  aspect,
}: {
  url: string;
  thumbnail: string | null;
  fallback: string | null;
  label: string;
  fileName: string;
  aspect: '9/16' | '16/9';
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white">
      <VideoWithPoster
        src={url}
        poster={thumbnail}
        fallbackImage={fallback}
        aspectRatio={aspect}
      />
      <div className="px-3 pt-2 text-[15px] font-medium text-navy-900 truncate">{label}</div>
      <div className="flex gap-2 p-3">
        <DownloadLinkButton url={url} label="Download" fileName={fileName} className="flex-1" />
        <CopyButton
          text={url}
          label=""
          copiedLabel=""
          size="icon"
          icon={<Copy className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}

function EmbedCard({ title, embedUrl }: { title: string; embedUrl: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="truncate text-[15px] font-medium text-navy-900">{title}</div>
        <CopyButton
          text={embedUrl}
          label="Copy Link"
          size="default"
          className="bg-navy-700 text-white hover:bg-navy-600 hover:text-white"
        />
      </div>
      <div className="aspect-video overflow-hidden rounded-lg bg-black/5">
        <iframe src={embedUrl} className="h-full w-full" allowFullScreen loading="lazy" />
      </div>
    </div>
  );
}

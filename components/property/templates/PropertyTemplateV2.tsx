import Image from 'next/image';
import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';
import ContactForm from '@/components/property/ContactForm';
import HeroSlider from '@/components/property/HeroSlider';
import TopAnchorMenu from '@/components/property/TopAnchorMenu';
import { sanitizeDescription } from '@/lib/sanitize';
import MapWithMarker from '@/components/property/MapWithMarker';
import {
  Bed,
  Bath,
  Ruler,
  Calendar,
  Hash,
  DollarSign,
  Check,
} from 'lucide-react';

export default function PropertyTemplateV2({
  order,
  baseUrl,
}: {
  order: any;
  baseUrl: string;
}) {
  const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`;
  const fullUrl = `${baseUrl}/property/${order.id}/v2`;
  const heroUrl: string | undefined =
    order.photos[0]?.url || order.photos[0]?.urlMls;
  const photoItems = order.photos.map((pp: any) => ({
    src: pp.urlMls || pp.url,
    alt: pp.filename,
  }));
  const floorPlanItems = order.floorPlans.map((fp: any) => ({
    src: fp.url,
    alt: fp.filename,
  }));
  const iguide =
    order.embeds.find((e: any) => /iguide|matterport|tour/i.test(e.embedUrl)) ||
    order.embeds[0];

  const phoneTel: string | undefined = order.realtor.phone
    ? `tel:${String(order.realtor.phone).replace(/[^+\d]/g, '')}`
    : undefined;

  const mosaicHeights: string[] = [
    'h-40 sm:h-56',
    'h-56 sm:h-72',
    'h-48 sm:h-64',
    'h-64 sm:h-80',
    'h-52 sm:h-72',
    'h-72 sm:h-96',
  ];

  return (
    <div className="overflow-x-hidden">
      <section className="relative isolate">
        <HeroSlider
          images={order.photos.map((p: any) => p.urlMls || p.url)}
          url={fullUrl}
          title={
            order.propertyAddress?.split(',')[0] ||
            (order.propertyFormattedAddress || '').split(',')[0] ||
            order.propertyAddress
          }
        />
        <TopAnchorMenu
          showFeatures={Boolean(order.featuresText)}
          showDescription={Boolean(order.description)}
          showPhotos={order.photos.length > 0}
          showFloorPlans={order.floorPlans.length > 0}
          showVideo={order.videos.length > 0}
          showTours={Boolean(iguide)}
          showMap={order.propertyLat != null && order.propertyLng != null}
        />

        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Address centered like V1 and remains vertically centered */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center translate-y-10 md:translate-y-0">
              <h1 className="px-4 text-white text-4xl md:text-7xl font-extrabold leading-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.6)]">
                {order.propertyAddress?.split(',')[0] ||
                  (order.propertyFormattedAddress || '').split(',')[0] ||
                  order.propertyAddress}
              </h1>
              <div className="mt-1 text-white/90 text-sm md:text-base drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
                {[
                  order.propertyCity,
                  order.propertyProvince,
                  order.propertyPostalCode,
                ]
                  .filter(Boolean)
                  .join(', ') ||
                  (order.propertyFormattedAddress || '')
                    .split(',')
                    .slice(1, 3)
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                    .join(', ')}
              </div>
            </div>
          </div>

          {/* Realtor infobox positioned above the centered address */}
          <div className="absolute left-1/2 bottom-[calc(50%+1.25rem)] md:bottom-[calc(50%+3rem)] -translate-x-1/2 pointer-events-auto">
            <div className="bg-white/60 backdrop-blur px-5 md:px-6 py-4 md:py-5 rounded-xl shadow-xl w-[90vw] sm:w-auto">
              <div className="flex items-center gap-4">
                {order.realtor.headshot && (
                  <Image
                    src={order.realtor.headshot}
                    alt={realtorName}
                    width={72}
                    height={72}
                    className="rounded-full object-cover"
                  />
                )}
                <div className="text-gray-900">
                  {order.realtor.companyLogo && (
                    <Image
                      src={order.realtor.companyLogo}
                      alt={order.realtor.companyName || 'Company Logo'}
                      width={140}
                      height={48}
                      className="h-8 w-auto object-contain mb-1"
                    />
                  )}
                  <div className="text-base md:text-xl font-semibold">
                    {realtorName}
                  </div>
                  {order.realtor.phone && (
                    <a
                      href={phoneTel}
                      className="text-sm md:text-base text-gray-700 hover:text-gray-900"
                    >
                      {order.realtor.phone}
                    </a>
                  )}
                  {order.realtor.companyName && (
                    <div className="text-gray-700 text-sm md:text-base">
                      {order.realtor.companyName}
                    </div>
                  )}
                  <a
                    href="#contact"
                    className="mt-2 inline-block bg-gray-900 text-white text-sm md:text-base px-4 md:px-5 py-2 rounded-md font-medium"
                  >
                    Contact Me
                  </a>
                </div>
              </div>
            </div>
          </div>
          {/* Property details overlay (desktop only) */}
          <div className="hidden md:block absolute left-1/2 bottom-6 -translate-x-1/2 z-10 pointer-events-auto w-[92vw] max-w-6xl">
            <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="rounded-xl bg-white shadow-xl p-3">
                <Detail label="Beds" value={order.bedrooms ?? '—'} Icon={Bed} />
              </div>
              <div className="rounded-xl bg-white shadow-xl p-3">
                <Detail
                  label="Baths"
                  value={order.bathrooms ?? '—'}
                  Icon={Bath}
                />
              </div>
              <div className="rounded-xl bg-white shadow-xl p-3">
                <Detail
                  label="Sqft"
                  value={order.propertySize ?? '—'}
                  Icon={Ruler}
                />
              </div>
              <div className="rounded-xl bg-white shadow-xl p-3">
                <Detail
                  label="Year"
                  value={order.yearBuilt ?? '—'}
                  Icon={Calendar}
                />
              </div>
              <div className="rounded-xl bg-white shadow-xl p-3">
                <Detail
                  label="MLS"
                  value={order.mlsNumber || '—'}
                  Icon={Hash}
                />
              </div>
              <div className="rounded-xl bg-white shadow-xl p-3">
                <Detail
                  label="Price"
                  value={
                    order.listPrice
                      ? `$${order.listPrice.toLocaleString()}`
                      : '—'
                  }
                  Icon={DollarSign}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl p-4 space-y-12 mt-8 md:mt-12">
        <div className="md:hidden">
          <Section id="details" title="Property Details">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-base md:text-lg">
              <Detail label="Beds" value={order.bedrooms ?? '—'} Icon={Bed} />
              <Detail
                label="Baths"
                value={order.bathrooms ?? '—'}
                Icon={Bath}
              />
              <Detail
                label="Sqft"
                value={order.propertySize ?? '—'}
                Icon={Ruler}
              />
              <Detail
                label="Year"
                value={order.yearBuilt ?? '—'}
                Icon={Calendar}
              />
              <Detail label="MLS" value={order.mlsNumber || '—'} Icon={Hash} />
              <Detail
                label="Price"
                value={
                  order.listPrice ? `$${order.listPrice.toLocaleString()}` : '—'
                }
                Icon={DollarSign}
              />
            </div>
          </Section>
        </div>

        {order.featuresText && (
          <Section id="features" title="Features">
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0">
              {String(order.featuresText)
                .split(/\r?\n/)
                .map((ln: string) => ln.trim())
                .filter(Boolean)
                .map((ln: string, i: number) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-base md:text-lg text-gray-800"
                  >
                    <Check className="w-5 h-5 mt-1 shrink-0 text-emerald-600" />
                    <span>{ln}</span>
                  </li>
                ))}
            </ul>
          </Section>
        )}

        {order.description && (
          <Section id="description" title="Description">
            <div
              className="text-gray-800 leading-7 [&_*+_*]:mt-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-base [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
              dangerouslySetInnerHTML={{
                __html: sanitizeDescription(
                  String(order.description).replace(/^(<br\s*\/?\>)+/i, '')
                ),
              }}
            />
          </Section>
        )}

        {!!order.photos.length && (
          <Section id="photos" title="Photo Gallery">
            <div className="columns-1 sm:columns-2 md:columns-3 xl:columns-4 [column-gap:0.75rem] md:[column-gap:1rem]">
              {order.photos.map((p: any, i: number) => (
                <div
                  key={p.id}
                  className={`inline-block w-full align-top mb-3 md:mb-4 break-inside-avoid [break-inside:avoid] [break-inside:avoid-column] overflow-hidden rounded-md ${
                    mosaicHeights[i % mosaicHeights.length]
                  }`}
                >
                  <PhotoLightbox
                    src={p.urlMls || p.url}
                    alt={p.filename}
                    items={photoItems}
                    startIndex={order.photos.findIndex(
                      (x: any) => x.id === p.id
                    )}
                    thumbClassName="w-full h-full object-cover cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {!!order.floorPlans.length && (
          <Section id="floorplans" title="Floor Plans">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {order.floorPlans.map((f: any) => (
                <div key={f.id} className="border rounded-md overflow-hidden">
                  <PhotoLightbox
                    src={f.url}
                    alt={f.filename}
                    items={floorPlanItems}
                    startIndex={order.floorPlans.findIndex(
                      (x: any) => x.id === f.id
                    )}
                    thumbClassName="w-full h-40 object-cover cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {!!order.videos.length && (
          <Section id="video" title="Video Tour">
            <div className="aspect-video bg-black rounded overflow-hidden">
              <video controls className="w-full h-full object-contain">
                <source src={order.videos[0].url} />
              </video>
            </div>
          </Section>
        )}

        {iguide && (
          <Section id="tours" title="Virtual Tour">
            <div className="aspect-video rounded overflow-hidden bg-black/5">
              <iframe
                src={iguide.embedUrl}
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </Section>
        )}

        <Section id="contact" title="Presented By">
          <div className="grid md:grid-cols-2 gap-6 items-start">
            <div className="flex items-center gap-4">
              {order.realtor.headshot && (
                <Image
                  src={order.realtor.headshot}
                  alt={realtorName}
                  width={72}
                  height={72}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <div className="font-medium">{realtorName}</div>
                <div className="text-gray-600 text-sm">
                  {order.realtor.companyName || '—'}
                </div>

                {order.realtor.phone && (
                  <div className="text-gray-600 text-sm">
                    {order.realtor.phone}
                  </div>
                )}
                {order.realtor.companyLogo && (
                  <div className="mt-3">
                    <Image
                      src={order.realtor.companyLogo}
                      alt={order.realtor.companyName || 'Company Logo'}
                      width={160}
                      height={60}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <ContactForm orderId={order.id} />
            </div>
          </div>
        </Section>

        {order.propertyLat != null && order.propertyLng != null && (
          <section
            id="map"
            className="relative -mx-[calc(50vw-50%)] w-[100vw] overflow-x-hidden"
          >
            <div className="aspect-video md:aspect-[28/9] overflow-hidden">
              <MapWithMarker lat={order.propertyLat} lng={order.propertyLng} />
            </div>
          </section>
        )}

        <footer className="text-xs text-gray-500 text-center py-6 space-y-4">
          <div className="flex justify-center">
            <img
              src="/images/crea-logos.png"
              alt="REALTOR and MLS trademarks"
              className="h-8 md:h-10 w-auto object-contain"
            />
          </div>
          <div className="max-w-4xl mx-auto px-4 space-y-2 leading-relaxed">
            <p>
              The trademarks REALTOR®, REALTORS®, and the REALTOR® logo are
              controlled by The Canadian Real Estate Association (CREA) and
              identify real estate professionals who are members of CREA.
            </p>
            <p>
              The trademarks MLS®, Multiple Listing Service® and the associated
              logos are owned by The Canadian Real Estate Association (CREA) and
              identify the quality of services provided by real estate
              professionals who are members of CREA. Used under license.
            </p>
          </div>
          <div className="text-gray-600">
            Powered by{' '}
            <a
              className="underline"
              href="https://photos4realestate.ca/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Photos 4 Real Estate
            </a>{' '}
            · © {new Date().getFullYear()} All Rights Reserved
          </div>

          <div>
            <a
              className="underline"
              href="https://photos4realestate.ca/terms-and-conditions/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Terms
            </a>{' '}
            ·{' '}
            <a
              className="underline"
              href="https://photos4realestate.ca/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Privacy
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{title}</h2>
      <div className="h-px bg-gray-200/80" />
      {children}
    </section>
  );
}

function Detail({
  label,
  value,
  Icon,
}: {
  label: string;
  value: string | number;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex items-center gap-3 p-2">
      <Icon className="w-5 h-5 text-gray-600" />
      <div>
        <div className="text-[11px] md:text-xs text-gray-500 uppercase tracking-wide">
          {label}
        </div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}

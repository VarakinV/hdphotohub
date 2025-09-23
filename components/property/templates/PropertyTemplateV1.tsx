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

export default function PropertyTemplateV1({
  order,
  baseUrl,
}: {
  order: any;
  baseUrl: string;
}) {
  const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`;
  const fullUrl = `${baseUrl}/property/${order.id}/v1`;
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

  return (
    <div className="overflow-x-hidden">
      {/* 1. Hero (slider) */}
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
          {/* Address: top on mobile, centered on desktop */}
          <div className="absolute inset-0 flex items-start md:items-center justify-center pt-16 md:pt-0">
            <div className="text-center">
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

          {/* Realtor info bottom-right aligned to viewport edge */}
          <div className="absolute right-4 bottom-20 md:bottom-6 pointer-events-auto">
            <div className="flex items-center gap-4 text-white">
              {order.realtor.headshot ? (
                <Image
                  src={order.realtor.headshot}
                  alt={realtorName}
                  width={96}
                  height={96}
                  className="rounded-full object-cover"
                />
              ) : null}
              <div>
                <div className="text-2xl font-semibold">{realtorName}</div>
                {order.realtor.phone ? (
                  <a
                    href={`tel:${order.realtor.phone}`}
                    className="mt-1 text-2xl md:text-4xl font-bold underline-offset-4 hover:underline pointer-events-auto"
                  >
                    {order.realtor.phone}
                  </a>
                ) : null}
                {order.realtor.companyLogo ? (
                  <div className="mt-3">
                    <Image
                      src={order.realtor.companyLogo}
                      alt={order.realtor.companyName || 'Company Logo'}
                      width={160}
                      height={60}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                ) : null}
                {order.realtor.companyName ? (
                  <div className="text-white/80 text-sm mt-1">
                    {order.realtor.companyName}
                  </div>
                ) : null}
                <a
                  href="#contact"
                  className="mt-3 inline-flex items-center px-4 py-2 rounded-md bg-white/90 text-gray-900 hover:bg-white transition pointer-events-auto"
                >
                  Contact Me
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl p-4 space-y-12 mt-8 md:mt-12">
        {/* 2. Property Details */}
        <section id="details" className="space-y-2">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Property Details
          </h2>
          <div className="h-px bg-gray-200/80" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-base md:text-lg">
            <Detail label="Beds" value={order.bedrooms ?? '—'} Icon={Bed} />
            <Detail label="Baths" value={order.bathrooms ?? '—'} Icon={Bath} />
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
        </section>

        {/* 3. Features */}
        {order.featuresText && (
          <section id="features" className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Features</h2>
            <div className="h-px bg-gray-200/80" />
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-0">
              {String(order.featuresText)
                .split(/\r?\n/)
                .map((ln: string, i: number) => ln.trim())
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
          </section>
        )}

        {/* 4. Description */}
        {order.description && (
          <section id="description" className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Description</h2>
            <div className="h-px bg-gray-200/80" />
            <div
              className="text-gray-800 leading-7 [&_*+_*]:mt-3 [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_p]:text-base [&_ul]:list-disc [&_ol]:list-decimal [&_ul]:pl-5 [&_ol]:pl-5"
              dangerouslySetInnerHTML={{
                __html: sanitizeDescription(
                  String(order.description).replace(/^(<br\s*\/?\>)+/i, '')
                ),
              }}
            />
          </section>
        )}

        {/* 5. Photo Gallery */}
        {!!order.photos.length && (
          <section id="photos" className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">
              Photo Gallery
            </h2>
            <div className="h-px bg-gray-200/80" />
            <div className="columns-2 sm:columns-3 md:columns-4 [column-gap:0.75rem] md:[column-gap:1rem]">
              {order.photos.map((p: any) => (
                <div
                  key={p.id}
                  className="mb-3 md:mb-4 break-inside-avoid overflow-hidden rounded-md"
                >
                  <PhotoLightbox
                    src={p.urlMls || p.url}
                    alt={p.filename}
                    items={photoItems}
                    startIndex={order.photos.findIndex(
                      (x: any) => x.id === p.id
                    )}
                    thumbClassName="w-full h-auto cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 6. Floor Plans */}
        {!!order.floorPlans.length && (
          <section id="floorplans" className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Floor Plans</h2>
            <div className="h-px bg-gray-200/80" />
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
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 7. Embedded Video */}
        {!!order.videos.length && (
          <section id="video" className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Video Tour</h2>
            <div className="h-px bg-gray-200/80" />
            <div className="aspect-video bg-black rounded overflow-hidden">
              <video controls className="w-full h-full object-contain">
                <source src={order.videos[0].url} />
              </video>
            </div>
          </section>
        )}

        {/* 8. Embedded iGUIDE */}
        {iguide && (
          <section id="tours" className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-semibold">Virtual Tour</h2>
            <div className="h-px bg-gray-200/80" />
            <div className="aspect-video rounded overflow-hidden bg-black/5">
              <iframe
                src={iguide.embedUrl}
                className="w-full h-full"
                allowFullScreen
                loading="lazy"
              />
            </div>
          </section>
        )}

        {/* 9. Presented By */}
        <section id="contact" className="space-y-4">
          <h2 className="text-2xl md:text-3xl font-semibold">Presented By</h2>
          <div className="h-px bg-gray-200/80" />
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
        </section>

        {/* 10. Property Map */}
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

        {/* 11. Footer */}
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

import Image from 'next/image';
import { PhotoLightbox } from '@/components/delivery/PhotoLightbox';
import ContactForm from '@/components/property/ContactForm';
import HeroSlider from '@/components/property/HeroSlider';
import TopAnchorMenu from '@/components/property/TopAnchorMenu';
import {
  Bed,
  Bath,
  Ruler,
  Calendar,
  Hash,
  DollarSign,
  Check,
} from 'lucide-react';

export default function PropertyTemplateV3({
  order,
  baseUrl,
}: {
  order: any;
  baseUrl: string;
}) {
  const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`;
  const fullUrl = `${baseUrl}/property/${order.id}/v3`;
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

  // Convenience hero strings
  const address: string =
    order.propertyFormattedAddress || order.propertyAddress || '';
  const city: string | undefined = order.propertyCity;
  const provinceState: string | undefined =
    order.propertyState || order.propertyProvinceState || order.propertyRegion;
  const cityState: string = [city, provinceState].filter(Boolean).join(', ');
  const phoneTel: string | undefined = order.realtor.phone
    ? `tel:${String(order.realtor.phone).replace(/[^+\d]/g, '')}`
    : undefined;

  return (
    <div>
      {/* Split hero with overlay card (slider background) */}
      <section className="relative isolate">
        <HeroSlider
          images={order.photos.map((p: any) => p.urlMls || p.url)}
          url={fullUrl}
          title={order.propertyFormattedAddress || order.propertyAddress}
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

        {/* Address strip across the hero (starts at left edge, auto width to content) */}
        <div className="absolute left-0 bottom-24 md:bottom-28 z-20">
          <div className="inline-block bg-white/95 backdrop-blur shadow-xl rounded-none px-5 md:px-7 py-4 md:py-5">
            <div className="text-3xl md:text-5xl font-semibold text-gray-900 leading-tight">
              {address}
            </div>
            {!!cityState && (
              <div className="mt-1 text-gray-700 tracking-wide uppercase text-xs md:text-sm">
                {cityState}
              </div>
            )}
            {order.status && order.status !== 'PUBLISHED' && (
              <div className="mt-3 inline-block bg-gray-900 text-white text-xs md:text-sm px-3 py-1 rounded">
                Coming Soon
              </div>
            )}
          </div>
        </div>

        {/* Realtor info bottom-right (aligned to content width) */}
        <div className="absolute inset-x-0 -bottom-10 md:-bottom-12 z-30">
          <div className="mx-auto max-w-6xl px-4 flex justify-end items-end gap-5">
            <div className="flex flex-col items-end bg-white/90 backdrop-blur px-5 md:px-6 py-4 md:py-5 rounded-xl shadow-xl max-w-[88%] sm:max-w-none">
              {order.realtor.companyLogo && (
                <img
                  src={order.realtor.companyLogo}
                  alt={order.realtor.companyName || 'Company logo'}
                  className="h-9 w-auto object-contain mb-2"
                />
              )}
              <div className="text-base md:text-xl font-semibold text-gray-900">
                {realtorName}
              </div>
              <div className="text-gray-700 text-sm md:text-base">
                {order.realtor.companyName || ''}
              </div>
              {order.realtor.phone && (
                <a
                  href={phoneTel}
                  className="text-gray-700 text-sm md:text-base hover:text-gray-900 mt-1"
                >
                  {order.realtor.phone}
                </a>
              )}
              <a
                href="#contact"
                className="mt-3 inline-block bg-gray-900 text-white text-sm md:text-base px-4 md:px-5 py-2 md:py-2.5 rounded-md font-medium"
              >
                Contact Me
              </a>
            </div>
            {order.realtor.headshot && (
              <Image
                src={order.realtor.headshot}
                alt={realtorName}
                width={104}
                height={104}
                className="rounded-full object-cover ring-4 ring-white shadow-2xl"
              />
            )}
          </div>
        </div>

        {/* Angled bottom edge (35%) */}
        <div className="pointer-events-none absolute inset-x-0 -bottom-px h-20 md:h-32 bg-white z-10 [clip-path:polygon(0_100%,100%_35%,100%_100%,0%_100%)]"></div>
      </section>

      <main className="mx-auto max-w-6xl p-4 space-y-12 mt-8 md:mt-12">
        <Section id="details" title="Property Details">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-base md:text-lg">
            <Detail
              label="Beds"
              value={order.bedrooms ?? '\u2014'}
              Icon={Bed}
            />
            <Detail
              label="Baths"
              value={order.bathrooms ?? '\u2014'}
              Icon={Bath}
            />
            <Detail
              label="Sqft"
              value={order.propertySize ?? '\u2014'}
              Icon={Ruler}
            />
            <Detail
              label="Year"
              value={order.yearBuilt ?? '\u2014'}
              Icon={Calendar}
            />
            <Detail
              label="MLS"
              value={order.mlsNumber || '\u2014'}
              Icon={Hash}
            />
            <Detail
              label="Price"
              value={
                order.listPrice
                  ? `$${order.listPrice.toLocaleString()}`
                  : '\u2014'
              }
              Icon={DollarSign}
            />
          </div>
        </Section>

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
            <p className="text-gray-700 whitespace-pre-line leading-7">
              {order.description}
            </p>
          </Section>
        )}

        {!!order.photos.length && (
          <Section id="photos" title="Photo Gallery">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {order.photos.map((p: any) => (
                <div key={p.id} className="border rounded-md overflow-hidden">
                  <PhotoLightbox
                    src={p.urlMls || p.url}
                    alt={p.filename}
                    items={photoItems}
                    startIndex={order.photos.findIndex(
                      (x: any) => x.id === p.id
                    )}
                    thumbClassName="w-full h-36 object-cover cursor-pointer"
                  />
                </div>
              ))}
            </div>
          </Section>
        )}

        {!!order.floorPlans.length && (
          <Section id="floorplans" title="Floor Plans">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {order.floorPlans.map((f: any) => (
                <div key={f.id} className="border rounded-md overflow-hidden">
                  <PhotoLightbox
                    src={f.url}
                    alt={f.filename}
                    items={floorPlanItems}
                    startIndex={order.floorPlans.findIndex(
                      (x: any) => x.id === f.id
                    )}
                    thumbClassName="w-full h-36 object-cover cursor-pointer"
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
                  width={64}
                  height={64}
                  className="rounded-full object-cover"
                />
              )}
              <div>
                <div className="font-medium">{realtorName}</div>
                <div className="text-gray-600 text-sm">
                  {order.realtor.companyName || '\u2014'}
                </div>
                <div className="text-gray-600 text-sm">
                  {order.realtor.email}
                </div>
                {order.realtor.phone && (
                  <div className="text-gray-600 text-sm">
                    {order.realtor.phone}
                  </div>
                )}
              </div>
            </div>
            <div>
              <ContactForm orderId={order.id} toEmail={order.realtor.email} />
            </div>
          </div>
        </Section>

        {order.propertyLat != null && order.propertyLng != null && (
          <Section id="map" title="Map">
            <div className="aspect-video rounded overflow-hidden">
              <iframe
                src={`https://www.google.com/maps?q=${order.propertyLat},${order.propertyLng}&z=15&output=embed`}
                className="w-full h-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </Section>
        )}

        <footer className="text-xs text-gray-500 text-center py-6">
          Proudly created by Photos4RealEstate ·{' '}
          <a className="underline" href="/terms">
            Terms
          </a>{' '}
          ·{' '}
          <a className="underline" href="/privacy">
            Privacy
          </a>
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

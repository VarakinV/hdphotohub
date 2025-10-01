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
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Twitter,
  Link2,
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
  const formatted: string =
    order.propertyFormattedAddress ||
    order.propertyAddressOverride ||
    order.propertyAddress ||
    '';
  const street: string =
    (order.propertyAddressOverride &&
      order.propertyAddressOverride.split(',')[0]) ||
    (order.propertyAddress && order.propertyAddress.split(',')[0]) ||
    (formatted && formatted.split(',')[0]) ||
    '';
  const cityLine: string =
    [
      order.propertyCityOverride || order.propertyCity,
      order.propertyProvince,
      order.propertyPostalCodeOverride || order.propertyPostalCode,
    ]
      .filter(Boolean)
      .join(', ') ||
    (formatted
      ? formatted
          .split(',')
          .slice(1, 3)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .join(', ')
      : '');
  const phoneTel: string | undefined = order.realtor.phone
    ? `tel:${String(order.realtor.phone).replace(/[^+\d]/g, '')}`
    : undefined;

  return (
    <div className="overflow-x-hidden">
      {/* Split hero with overlay card (slider background) */}
      <section className="relative isolate">
        <HeroSlider
          images={order.photos.map((p: any) => p.urlMls || p.url)}
          url={fullUrl}
          title={street}
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
              {street}
            </div>
            {!!cityLine && (
              <div className="mt-1 text-gray-700 text-xs md:text-sm">
                {cityLine}
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
        <div className="absolute left-3 top-3 md:inset-x-0 md:-bottom-12 md:top-auto md:-translate-y-5 z-30">
          <div className="mx-auto max-w-6xl px-4 flex md:justify-end justify-start items-end gap-5">
            <div className="relative flex flex-col items-start md:items-end text-left md:text-right bg-white/90 backdrop-blur px-5 md:px-6 py-4 md:py-5 rounded-xl shadow-xl w-[78%] sm:w-auto md:w-auto max-w-[92%] md:max-w-none">
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
                className="block rounded-full object-cover ring-4 ring-white shadow-2xl"
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
              {order.photos.map((p: any) => (
                <div key={p.id} className="overflow-hidden rounded-md">
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

                {(order.realtor.facebookUrl ||
                  order.realtor.linkedinUrl ||
                  order.realtor.instagramUrl ||
                  order.realtor.youtubeUrl ||
                  order.realtor.twitterUrl ||
                  order.realtor.pinterestUrl ||
                  order.realtor.vimeoUrl) && (
                  <div className="mt-3 flex flex-wrap gap-3 text-gray-600">
                    {order.realtor.facebookUrl && (
                      <a
                        href={order.realtor.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Facebook"
                      >
                        <Facebook className="h-5 w-5" />
                      </a>
                    )}
                    {order.realtor.linkedinUrl && (
                      <a
                        href={order.realtor.linkedinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                      >
                        <Linkedin className="h-5 w-5" />
                      </a>
                    )}
                    {order.realtor.instagramUrl && (
                      <a
                        href={order.realtor.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                      >
                        <Instagram className="h-5 w-5" />
                      </a>
                    )}
                    {order.realtor.youtubeUrl && (
                      <a
                        href={order.realtor.youtubeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="YouTube"
                      >
                        <Youtube className="h-5 w-5" />
                      </a>
                    )}
                    {order.realtor.twitterUrl && (
                      <a
                        href={order.realtor.twitterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Twitter/X"
                      >
                        <Twitter className="h-5 w-5" />
                      </a>
                    )}
                    {order.realtor.pinterestUrl && (
                      <a
                        href={order.realtor.pinterestUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Pinterest"
                      >
                        <Link2 className="h-5 w-5" />
                      </a>
                    )}
                    {order.realtor.vimeoUrl && (
                      <a
                        href={order.realtor.vimeoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Vimeo"
                      >
                        <Link2 className="h-5 w-5" />
                      </a>
                    )}
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

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

  const mosaicHeights: string[] = [
    'h-40 sm:h-56',
    'h-56 sm:h-72',
    'h-48 sm:h-64',
    'h-64 sm:h-80',
    'h-52 sm:h-72',
    'h-72 sm:h-96',
  ];

  return (
    <div>
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

        <div className="absolute inset-0 z-10 text-white">
          <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
            <div className="max-w-xl space-y-2">
              <div className="text-3xl md:text-5xl font-extrabold tracking-tight">
                {order.propertyFormattedAddress || order.propertyAddress}
              </div>
              <div className="text-white/90">
                {order.description?.slice(0, 160) || ''}
              </div>
            </div>
            <div className="mt-8 flex items-center gap-4">
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
                <div className="text-lg font-semibold">{realtorName}</div>
                <div className="text-white/80 text-sm">
                  {order.realtor.email}
                </div>
                {order.realtor.phone && (
                  <div className="text-white/80 text-sm">
                    {order.realtor.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl p-4 space-y-12 mt-8 md:mt-12">
        <Section id="details" title="Property Details">
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

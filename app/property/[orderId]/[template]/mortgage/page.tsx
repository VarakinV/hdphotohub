import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Calculator } from 'lucide-react';
import { prisma } from '@/lib/db/prisma';
import { Button } from '@/components/ui/button';
import MortgageCalculator from '@/components/property/MortgageCalculator';
import { formatCurrency } from '@/lib/mortgage';

async function getOrder(orderId: string) {
  return prisma.order.findUnique({
    where: { id: orderId },
    include: {
      realtor: true,
      photos: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ orderId: string; template: string }>;
}): Promise<Metadata> {
  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) return {};

  const address = order.propertyFormattedAddress || order.propertyAddress || 'Property';
  return {
    title: `${address} — Mortgage Calculator`,
    description: `Estimate mortgage payments for ${address} using the current list price, down payment, amortization, and payment frequency.`,
  };
}

export default async function MortgagePage({
  params,
}: {
  params: Promise<{ orderId: string; template: string }>;
}) {
  const { orderId, template } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();

  const heroUrl = order.photos[0]?.urlMls || order.photos[0]?.url || '';
  const fullAddress =
    order.propertyFormattedAddress || order.propertyAddress || 'This property';
  const street =
    (order.propertyAddressOverride || order.propertyAddress || fullAddress).split(',')[0] ||
    fullAddress;
  const cityLine = [
    order.propertyCityOverride || order.propertyCity,
    order.propertyProvince,
    order.propertyPostalCodeOverride || order.propertyPostalCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-slate-950">
        {heroUrl ? (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-40"
            style={{ backgroundImage: `url(${heroUrl})` }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-800/80" />

        <div className="relative mx-auto max-w-6xl px-4 py-10 md:py-14">
          <Button asChild variant="outline" className="border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white">
            <Link href={`/property/${order.id}/${template}`}>
              <ArrowLeft className="h-4 w-4" />
              Back to Property
            </Link>
          </Button>

          <div className="mt-8 max-w-3xl text-white">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm text-white/80">
              <Calculator className="h-4 w-4" />
              Mortgage Calculator
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              {street}
            </h1>
            {cityLine ? <p className="mt-2 text-base text-white/80 md:text-lg">{cityLine}</p> : null}
            <div className="mt-4 text-2xl font-semibold md:text-3xl">
              {order.listPrice ? formatCurrency(order.listPrice) : 'Price available on request'}
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <MortgageCalculator
          orderId={order.id}
          address={fullAddress}
          listPrice={order.listPrice ?? 0}
        />
      </main>
    </div>
  );
}
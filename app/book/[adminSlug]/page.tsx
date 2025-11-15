'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Layers as LayersIcon } from 'lucide-react';
import * as Lucide from 'lucide-react';
import PlacesAddressInput from '@/components/admin/PlacesAddressInput';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

import { getRecaptchaToken } from '@/lib/recaptcha/client';

// Types for catalog payload
type Catalog = {
  admin: {
    id: string;
    name: string | null;
    email: string | null;
    adminSlug: string | null;
  };
  settings: {
    timeZone: string;
    leadTimeMin: number;
    maxAdvanceDays: number;
    defaultBufferMin: number;
  } | null;
  availability: { rules: any[]; blackouts: any[] };
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description?: string | null;
    iconKey?: string | null;
    featured: boolean;
    sortOrder: number;
    services: Array<{
      id: string;
      name: string;
      slug: string;
      description?: string | null;
      priceCents: number;
      durationMin: number;
      bufferBeforeMin: number;
      bufferAfterMin: number;
      minSqFt?: number | null;
      maxSqFt?: number | null;
      taxRatesBps: number[];
    }>;
  }>;
  note: string;
};

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function iconFromKey(key?: string | null) {
  if (!key) return LayersIcon;
  const name = key as keyof typeof Lucide;
  const Comp = Lucide[name];
  return Comp || LayersIcon;
}

export default function PublicBookingPage() {
  const router = useRouter();

  const { adminSlug } = useParams<{ adminSlug: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<Catalog | null>(null);

  // Form state
  const [step, setStep] = useState(1);
  const [address, setAddress] = useState('');
  const [size, setSize] = useState<number | ''>('');
  const [selectedByCategory, setSelectedByCategory] = useState<
    Record<string, string[]>
  >({});
  const [notes, setNotes] = useState('');
  const [contact, setContact] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
  });

  // Address details (Google Places)
  const [formattedAddress, setFormattedAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [placeId, setPlaceId] = useState('');

  // Optional checkboxes
  const [prefSidebarPersistent, setPrefSidebarPersistent] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  // Time slots + submission state
  const [slots, setSlots] = useState<Array<{ start: string; end: string }>>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [selectedSlotISO, setSelectedSlotISO] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{
    bookingId: string;
    when: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Promo code state
  const [promoCode, setPromoCode] = useState('');
  const [promo, setPromo] = useState<{
    promoId?: string;
    discountCents: number;
    appliesToServiceIds?: string[];
    warning?: string;
  } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applyingPromo, setApplyingPromo] = useState(false);

  // Calendly-style calendar state
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  useEffect(() => {
    let abort = false;
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/booking/catalog/${adminSlug}`);
        if (!res.ok)
          throw new Error(
            (await res.json().catch(() => ({}))).error || 'Failed to load'
          );

        const data: Catalog = await res.json();
        if (!abort) setCatalog(data);
      } catch (e: any) {
        if (!abort) setError(e.message || 'Failed to load');
      } finally {
        if (!abort) setLoading(false);
      }
    }
    if (adminSlug) load();
    return () => {
      abort = true;
    };
  }, [adminSlug]);

  const sizeNumber =
    typeof size === 'number' ? size : parseInt(String(size || 0), 10) || 0;

  const filteredCategories = useMemo(() => {
    if (!catalog) return [] as Catalog['categories'];
    return catalog.categories.map((c) => ({
      ...c,
      services: c.services.filter((s) => {
        const minOk =
          s.minSqFt == null || sizeNumber === 0 || sizeNumber >= s.minSqFt;
        const maxOk =
          s.maxSqFt == null || sizeNumber === 0 || sizeNumber <= s.maxSqFt;
        return minOk && maxOk;
      }),
    }));
  }, [catalog, sizeNumber]);

  const selectedServices = useMemo(() => {
    if (!catalog)
      return [] as {
        id: string;
        name: string;
        priceCents: number;
        taxRatesBps: number[];
      }[];
    const byId = new Map<
      string,
      { id: string; name: string; priceCents: number; taxRatesBps: number[] }
    >();
    for (const cat of catalog.categories) {
      const svcIds = selectedByCategory[cat.id] || [];
      for (const id of svcIds) {
        const s = cat.services.find((x) => x.id === id);
        if (s)
          byId.set(s.id, {
            id: s.id,
            name: s.name,
            priceCents: s.priceCents,
            taxRatesBps: s.taxRatesBps,
          });
      }
    }
    return Array.from(byId.values());
  }, [catalog, selectedByCategory]);

  // Load slots when services change and at least one is selected
  useEffect(() => {
    async function loadSlots() {
      if (!catalog) return;
      const serviceIds = selectedServices.map((s) => s.id);
      if (serviceIds.length === 0) return;
      try {
        setSlotsLoading(true);
        const now = new Date();
        const days = catalog.settings?.maxAdvanceDays ?? 14;
        const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        // Abort fetch if it hangs > 10s (extensions/adblockers sometimes stall fetch)
        const ac = new AbortController();
        const timeout = setTimeout(() => ac.abort(), 20000);
        const res = await fetch(`/api/public/booking/slots/${adminSlug}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceIds,
            rangeStart: now.toISOString(),
            rangeEnd: end.toISOString(),
          }),
          signal: ac.signal,
        }).catch((err) => {
          throw err;
        });
        clearTimeout(timeout);
        if (!res.ok) throw new Error('Failed to load slots');
        const data = await res.json();
        setSlots(Array.isArray(data.slots) ? data.slots : []);
      } catch (e) {
        console.error('Failed to load slots', e);
        setSlots([]);
        try {
          toast.error('Could not load time slots. Please try again.');
        } catch {}
      } finally {
        setSlotsLoading(false);
      }
    }
    loadSlots();
  }, [selectedServices, catalog, adminSlug]);
  const totals = useMemo(() => {
    let subtotal = 0;
    for (const s of selectedServices) subtotal += s.priceCents;

    const discount = promo?.discountCents ?? 0;

    // Compute tax on discounted base (promo applies proportionally across eligible services)
    let tax = 0;
    if (discount > 0 && selectedServices.length > 0) {
      const eligibleIds = new Set(
        promo?.appliesToServiceIds && promo.appliesToServiceIds.length > 0
          ? promo.appliesToServiceIds
          : selectedServices.map((s) => s.id)
      );
      const eligible = selectedServices.filter((s) => eligibleIds.has(s.id));
      const eligibleSubtotal = eligible.reduce(
        (acc, s) => acc + s.priceCents,
        0
      );

      const discountShares: Record<string, number> = {};
      if (eligibleSubtotal > 0) {
        let remaining = discount;
        for (let i = 0; i < eligible.length; i++) {
          const s = eligible[i];
          const isLast = i === eligible.length - 1;
          let share = isLast
            ? remaining
            : Math.round((discount * s.priceCents) / eligibleSubtotal);
          if (share > remaining) share = remaining;
          discountShares[s.id] = share;
          remaining -= share;
        }
      }

      for (const s of selectedServices) {
        const share = discountShares[s.id] || 0;
        const baseAfter = Math.max(0, s.priceCents - share);
        const serviceTax = s.taxRatesBps.reduce(
          (acc, bps) => acc + Math.round((baseAfter * bps) / 10000),
          0
        );
        tax += serviceTax;
      }
    } else {
      for (const s of selectedServices) {
        const serviceTax = s.taxRatesBps.reduce(
          (acc, bps) => acc + Math.round((s.priceCents * bps) / 10000),
          0
        );
        tax += serviceTax;
      }
    }

    const total = Math.max(0, subtotal - discount + tax);
    return { subtotal, tax, discount, total };
  }, [selectedServices, promo]);
  // Using the shared PlacesAddressInput like admin orders/new; map preview shows only after address selection

  const slotsByDate = useMemo(() => {
    const by: Record<string, Array<{ start: string; end: string }>> = {};
    for (const s of slots) {
      const d = new Date(s.start);
      const key = d.toISOString().slice(0, 10);
      (by[key] ||= []).push(s);
    }
    for (const k of Object.keys(by)) {
      by[k].sort(
        (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
      );
    }

    return by;
  }, [slots]);

  async function handleApplyPromo() {
    try {
      setPromoError(null);
      setApplyingPromo(true);
      if (!promoCode.trim()) {
        setPromo(null);
        setPromoError('Enter a promo code');
        return;
      }
      const serviceIds = selectedServices.map((s) => s.id);
      const res = await fetch(
        `/api/public/booking/validate-promo/${adminSlug}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: promoCode.trim(),
            serviceIds,
            contactEmail: contact.email || undefined,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPromo(null);
        setPromoError(data.error || 'Invalid promo code');
        return;
      }
      setPromo({
        promoId: data.promoId,
        discountCents: data.discountCents,
        appliesToServiceIds: Array.isArray(data.appliesToServiceIds)
          ? data.appliesToServiceIds
          : undefined,
        warning: data.warning,
      });
    } catch (e: any) {
      setPromoError(e?.message || 'Failed to validate promo code');
      setPromo(null);
    } finally {
      setApplyingPromo(false);
    }
  }

  function clearPromo() {
    setPromo(null);
    setPromoCode('');
    setPromoError(null);
  }

  useEffect(() => {
    const keys = Object.keys(slotsByDate).sort();
    if (selectedDateKey) {
      const d = new Date(selectedDateKey);
      setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else if (keys.length) {
      setSelectedDateKey(keys[0]);
      const d = new Date(keys[0]);
      setCalendarMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    }
  }, [slotsByDate, selectedDateKey]);

  async function handleSubmit() {
    try {
      setSubmitError(null);
      setSubmitting(true);
      const serviceIds = selectedServices.map((s) => s.id);
      const recaptchaToken = await getRecaptchaToken('booking');
      const body = {
        address,
        formattedAddress: formattedAddress || address,
        lat,
        lng,
        city,
        province,
        postalCode,
        country,
        placeId,
        propertySizeSqFt: sizeNumber || null,
        notes,
        contactFirstName: contact.firstName,
        contactLastName: contact.lastName,
        contactEmail: contact.email,
        contactPhone: contact.phone || null,
        company: contact.company || null,
        serviceIds,
        slotStart: selectedSlotISO,
        promoCode: promoCode.trim() || undefined,
        recaptchaToken: recaptchaToken || undefined,
      };
      const res = await fetch(`/api/public/booking/submit/${adminSlug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to submit');

      const tz =
        catalog?.settings?.timeZone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone;
      const addr = (formattedAddress || address || '').toString();
      const qs = new URLSearchParams({
        bookingId: data.bookingId,
        start: selectedSlotISO || '',
        tz,
        address: addr,
      });
      router.push(`/book/confirmation?${qs.toString()}`);
    } catch (e: any) {
      setSubmitError(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  function toggleService(categoryId: string, serviceId: string) {
    setSelectedByCategory((prev) => {
      const current = prev[categoryId] || [];
      const exists = current.includes(serviceId);
      const next = exists
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId];
      return { ...prev, [categoryId]: next };
    });
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading booking...
        </div>
      </div>
    );
  }
  if (error || !catalog) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-red-600">
        {error || 'Failed to load'}
      </div>
    );
  }

  const featured = filteredCategories.filter((c) => c.featured);
  const alaCarte = filteredCategories.filter((c) => !c.featured);

  // Progress states for stepper
  const stage = {
    address: !!(lat && lng),
    size: sizeNumber > 0,
    services: selectedServices.length > 0,
    time: !!selectedSlotISO,
    contact: !!(contact.firstName && contact.lastName && contact.email),
  };
  const steps = [
    { key: 'Address', done: stage.address },
    { key: 'Size', done: stage.size },
    { key: 'Services', done: stage.services },
    { key: 'Time', done: stage.time },
    { key: 'Contact', done: stage.contact },
  ];
  const currentIdx = steps.findIndex((s) => !s.done);

  return (
    <>
      {/* Simple header matching home header height */}
      <header className="border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a
            href="https://photos4realestate.ca/"
            className="flex items-center gap-3"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8">
                <Image
                  src="/Map-Pin-Logo.svg"
                  alt="Photos4RealEstate logo"
                  fill
                  className="object-contain"
                  sizes="32px"
                />
              </div>
              <div className="leading-tight select-none">
                <div className="font-semibold text-[#cb4153]">
                  Photos 4 Real Estate
                </div>
                <div className="text-xs text-gray-500">
                  Elevate Your Real Estate Listings
                </div>
              </div>
            </div>
          </a>
          <a
            href="https://photos4realestate.ca/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-md border border-gray-200 hover:bg-gray-50"
          >
            Home
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-2xl font-semibold">Booking Form</h1>
        {/* Stepper */}
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {steps.map((s, i) => {
            const isCurrent =
              (currentIdx === -1 ? steps.length - 1 : currentIdx) === i &&
              !s.done;
            const cls = s.done
              ? 'bg-green-100 text-green-800 border-green-200'
              : isCurrent
              ? 'bg-[#ca4153]/10 text-[#ca4153] border-[#ca4153]/30'
              : 'bg-gray-50 text-gray-600 border-gray-200';
            return (
              <div
                key={s.key}
                className={`px-3 py-1 rounded-full border ${cls}`}
              >
                <span className="font-medium">{i + 1}.</span> {s.key}
              </div>
            );
          })}
        </div>

        {/* Property Address */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">Property Address</h2>
          <div className="grid gap-4">
            <div>
              <PlacesAddressInput
                name="propertyAddress"
                defaultValue={address}
                onResolved={(d) => {
                  setAddress(d.street || d.formatted || '');
                  setFormattedAddress(d.formatted || '');
                  setLat(d.lat ?? null);
                  setLng(d.lng ?? null);
                  setCity(d.city || '');
                  setProvince(d.province || '');
                  setPostalCode(d.postalCode || '');
                  setCountry(d.country || '');
                  setPlaceId(d.placeId || '');
                }}
              />
              {formattedAddress && (
                <div className="text-xs text-muted-foreground mt-1">
                  {formattedAddress}
                </div>
              )}
            </div>
            {lat != null && lng != null && (
              <div className="aspect-video rounded overflow-hidden border">
                <iframe
                  src={`https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`}
                  className="w-full h-full"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Approximate Property Size (sq ft) */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">
            Approximate Property Size (sq ft)
          </h2>
          <div className="grid gap-4">
            <div>
              <Input
                className="mt-1"
                type="number"
                min={0}
                placeholder="e.g., 2200"
                value={size}
                onChange={(e) =>
                  setSize(e.target.value ? parseInt(e.target.value, 10) : '')
                }
              />
              <div className="text-sm text-muted-foreground mt-2">
                Enter the total area to be measured, including basements,
                garages, and all levels (not just RMS).
              </div>
            </div>
          </div>
        </Card>

        {/* Choose Your Services */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">Choose Your Services</h2>
          <div className="grid gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Packages</h3>
              {featured.length === 0 && (
                <div className="text-sm text-muted-foreground">
                  No featured packages yet.
                </div>
              )}
              <div className="grid md:grid-cols-3 gap-3">
                {featured.map((cat) => {
                  const IconComp = iconFromKey(
                    cat.iconKey
                  ) as React.ElementType;
                  const selectedIds = selectedByCategory[cat.id] || [];
                  return (
                    <div key={cat.id} className="border rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComp className="h-4 w-4" />
                        <div className="font-medium">{cat.name}</div>
                      </div>
                      {cat.description && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {cat.description}
                        </div>
                      )}

                      <div className="space-y-2">
                        {cat.services.map((s) => (
                          <label
                            key={s.id}
                            className={`w-full rounded border p-2 hover:bg-accent flex items-start justify-between gap-3 ${
                              selectedIds.includes(s.id)
                                ? 'border-primary'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(s.id)}
                                onChange={() => toggleService(cat.id, s.id)}
                                className="mt-1"
                                aria-label={`Select ${s.name}`}
                              />
                              <div>
                                <div className="font-medium">{s.name}</div>
                                {s.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {s.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="font-semibold whitespace-nowrap">
                              {formatMoney(s.priceCents)}
                            </div>
                          </label>
                        ))}
                        {cat.services.length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            No services match this size.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">
                À la carte Services & Add-Ons
              </h3>
              <div className="grid md:grid-cols-3 gap-3">
                {alaCarte.map((cat) => {
                  const IconComp = iconFromKey(
                    cat.iconKey
                  ) as React.ElementType;
                  const selectedIds = selectedByCategory[cat.id] || [];

                  return (
                    <div key={cat.id} className="border rounded-md p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <IconComp className="h-4 w-4" />
                        <div className="font-medium">{cat.name}</div>
                      </div>
                      {cat.description && (
                        <div className="text-xs text-muted-foreground mb-2">
                          {cat.description}
                        </div>
                      )}

                      <div className="space-y-2">
                        {cat.services.map((s) => (
                          <label
                            key={s.id}
                            className={`w-full rounded border p-2 hover:bg-accent flex items-start justify-between gap-3 ${
                              selectedIds.includes(s.id)
                                ? 'border-primary'
                                : 'border-border'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(s.id)}
                                onChange={() => toggleService(cat.id, s.id)}
                                className="mt-1"
                                aria-label={`Select ${s.name}`}
                              />
                              <div>
                                <div className="font-medium">{s.name}</div>
                                {s.description && (
                                  <div className="text-xs text-muted-foreground">
                                    {s.description}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="font-semibold whitespace-nowrap">
                              {formatMoney(s.priceCents)}
                            </div>
                          </label>
                        ))}
                        {cat.services.length === 0 && (
                          <div className="text-sm text-muted-foreground">
                            No services match this size.
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Select at least one service to choose an appointment time.
            </div>
          </div>
        </Card>

        {/* Appointment Time */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">Appointment Time</h2>
          {(() => {
            // Calendly-style: calendar left, time slots right
            function startOfMonth(d: Date) {
              return new Date(d.getFullYear(), d.getMonth(), 1);
            }
            function daysInMonth(d: Date) {
              return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
            }
            const allKeys = Object.keys(slotsByDate).sort();
            const month = calendarMonth;
            const setMonth = setCalendarMonth;

            const firstDayIdx = startOfMonth(month).getDay();
            const total = daysInMonth(month);
            const grid: (Date | null)[] = [];
            for (let i = 0; i < firstDayIdx; i++) grid.push(null);
            for (let d = 1; d <= total; d++)
              grid.push(new Date(month.getFullYear(), month.getMonth(), d));

            const dayHasSlots = (d: Date) => {
              const k = d.toISOString().slice(0, 10);
              return !!slotsByDate[k];
            };

            const dayLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

            const activeSlots = selectedDateKey
              ? slotsByDate[selectedDateKey] || []
              : [];

            return (
              <div className="grid md:grid-cols-2 gap-6">
                {/* Calendar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      className="px-2 py-1 border rounded text-sm"
                      onClick={() =>
                        setMonth(
                          new Date(month.getFullYear(), month.getMonth() - 1, 1)
                        )
                      }
                    >
                      Prev
                    </button>
                    <div className="font-medium">
                      {month.toLocaleString(undefined, {
                        month: 'long',
                        year: 'numeric',
                      })}
                    </div>
                    <button
                      className="px-2 py-1 border rounded text-sm"
                      onClick={() =>
                        setMonth(
                          new Date(month.getFullYear(), month.getMonth() + 1, 1)
                        )
                      }
                    >
                      Next
                    </button>
                  </div>
                  <div className="grid grid-cols-7 text-xs text-muted-foreground">
                    {dayLabel.map((d) => (
                      <div key={d} className="p-1 text-center">
                        {d}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 mt-1">
                    {grid.map((d, idx) => {
                      if (!d) return <div key={idx} className="h-9" />;
                      const k = d.toISOString().slice(0, 10);
                      const isActive = selectedDateKey === k;
                      const selectable = dayHasSlots(d);
                      return (
                        <button
                          key={k}
                          disabled={!selectable}
                          onClick={() => setSelectedDateKey(k)}
                          className={`h-9 rounded text-sm border ${
                            isActive
                              ? 'border-primary bg-[#dafce5]'
                              : 'border-border'
                          } ${
                            selectable
                              ? 'hover:bg-accent'
                              : 'opacity-40 cursor-not-allowed'
                          }`}
                          title={d.toDateString()}
                        >
                          {d.getDate()}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Times shown in{' '}
                    {catalog.settings?.timeZone ||
                      Intl.DateTimeFormat().resolvedOptions().timeZone}
                  </div>
                </div>

                {/* Times for selected date */}
                <div>
                  <h3 className="text-sm font-medium mb-2">
                    Available time slots
                  </h3>
                  {slotsLoading ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading
                      available time slots...
                    </div>
                  ) : !selectedDateKey ? (
                    <div className="text-sm text-muted-foreground">
                      Select a date to see available times.
                    </div>
                  ) : activeSlots.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                      No available times for the selected date.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {activeSlots.map((s) => {
                        const start = new Date(s.start);
                        const label = start.toLocaleTimeString([], {
                          hour: 'numeric',
                          minute: '2-digit',
                          timeZone: catalog.settings?.timeZone || undefined,
                        });
                        const iso = s.start;
                        const active = selectedSlotISO === iso;
                        return (
                          <button
                            key={iso}
                            onClick={() => setSelectedSlotISO(iso)}
                            className={`px-3 py-1 rounded border text-sm ${
                              active
                                ? 'border-primary bg-[#dafce5]'
                                : 'border-border hover:bg-accent'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </Card>

        {/* Contact Information */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <Label>First Name</Label>
                <Input
                  className="mt-1"
                  value={contact.firstName}
                  onChange={(e) =>
                    setContact({ ...contact, firstName: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Last Name</Label>
                <Input
                  className="mt-1"
                  value={contact.lastName}
                  onChange={(e) =>
                    setContact({ ...contact, lastName: e.target.value })
                  }
                />
              </div>
              <div className="md:col-span-2">
                <Label>Email</Label>
                <Input
                  className="mt-1"
                  type="email"
                  value={contact.email}
                  onChange={(e) =>
                    setContact({ ...contact, email: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input
                  className="mt-1"
                  value={contact.phone}
                  onChange={(e) =>
                    setContact({ ...contact, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Company (optional)</Label>
                <Input
                  className="mt-1"
                  value={contact.company}
                  onChange={(e) =>
                    setContact({ ...contact, company: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <textarea
                className="mt-1 w-full min-h-[120px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
                rows={5}
                placeholder="Anything we should know?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {submitError && (
              <div className="text-sm text-red-600">{submitError}</div>
            )}

            {/* Confirmation */}
            {step === 6 && submitted && (
              <Card className="p-4">
                <div className="text-green-700 font-medium mb-1">
                  Booking request sent
                </div>
                <div className="text-sm text-muted-foreground">
                  Confirmation ID
                </div>
                <div className="text-lg font-mono">{submitted.bookingId}</div>
                <div className="mt-2">
                  Preferred time:{' '}
                  {new Date(submitted.when).toLocaleString([], {
                    timeZone: catalog.settings?.timeZone || undefined,
                  })}
                </div>
              </Card>
            )}
          </div>
        </Card>

        {/* Subtotal */}
        <Card className="p-4">
          <h2 className="text-xl font-semibold mb-3">Subtotal</h2>

          {/* Promo Code Input */}
          <div className="mb-3 flex gap-2">
            <input
              type="text"
              className="flex-1 rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring"
              placeholder="Promo Code"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value)}
            />
            {promo ? (
              <button
                type="button"
                onClick={clearPromo}
                className="rounded-md px-3 py-2 text-sm border bg-white hover:bg-gray-50"
              >
                Remove
              </button>
            ) : (
              <button
                type="button"
                onClick={handleApplyPromo}
                disabled={applyingPromo || selectedServices.length === 0}
                className="rounded-md px-3 py-2 text-sm border bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {applyingPromo ? 'Applying…' : 'Apply'}
              </button>
            )}
          </div>
          {promoError && (
            <div className="text-sm text-red-600 mb-2">{promoError}</div>
          )}
          {promo?.warning && (
            <div className="text-xs text-amber-600 mb-2">{promo.warning}</div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm">
              <span>Subtotal</span>
              <span>{formatMoney(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 && (
              <div className="flex items-center justify-between text-sm text-green-700">
                <span>Promo Discount</span>
                <span>-{formatMoney(totals.discount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span>Tax</span>
              <span>{formatMoney(totals.tax)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{formatMoney(totals.total)}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Displayed prices are estimates. Final charges may vary based on
              verified property square footage, selected services, and travel
              distance.
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={prefSidebarPersistent}
                  onChange={(e) => setPrefSidebarPersistent(e.target.checked)}
                />
                <span>
                  By checking this box, I consent to receive transactional
                  messages related to my account, orders, or services I have
                  requested from Photos 4 Real Estate. These messages may
                  include appointment reminders, order confirmations, and
                  account notifications among others. Message frequency may
                  vary. Message & Data rates may apply. Reply HELP for help or
                  STOP to opt-out.
                </span>
              </label>
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                />
                <span>
                  By checking this box, I consent to receive marketing and
                  promotional messages, including special offers, discounts, new
                  product updates among others, from Photos 4 Real Estate.
                  Message frequency may vary. Message & Data rates may apply.
                  Reply HELP for help or STOP to opt-out.
                </span>
              </label>
            </div>
          </div>
          <div className="mt-6 flex justify-center">
            <Button
              className="px-14 py-6 text-lg md:text-2xl"
              onClick={handleSubmit}
              disabled={
                submitting ||
                !selectedSlotISO ||
                !contact.firstName ||
                !contact.lastName ||
                !contact.email ||
                selectedServices.length === 0
              }
            >
              {submitting ? 'Submitting…' : 'Place Order'}
            </Button>
          </div>
        </Card>
      </main>

      {/* Footer */}
      <footer className="mt-8 border-t border-white/10 bg-[#131c3b] text-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 text-center text-sm">
          <div>
            Powered by{' '}
            <a
              href="https://photos4realestate.ca/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Photos 4 Real Estate
            </a>{' '}
            · © {new Date().getFullYear()} All Rights Reserved
          </div>
          <div className="mt-2 space-x-4">
            <a
              href="https://photos4realestate.ca/terms-and-conditions/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Terms
            </a>
            <a
              href="https://photos4realestate.ca/privacy-policy/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Privacy
            </a>
            <a
              href="https://photos4realestate.ca/contact-us/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Contacts
            </a>
          </div>
        </div>
      </footer>
      <Toaster />
    </>
  );
}

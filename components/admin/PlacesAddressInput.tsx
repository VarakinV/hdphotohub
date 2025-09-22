'use client';

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

export default function PlacesAddressInput({
  name = 'propertyAddress',
  defaultValue = '',
  defaultFormattedAddress,
  defaultLat,
  defaultLng,
  defaultCity,
  defaultProvince,
  defaultPostalCode,
  defaultCountry,
  defaultPlaceId,
  onResolved,
}: {
  name?: string;
  defaultValue?: string;
  defaultFormattedAddress?: string | null;
  defaultLat?: number | null;
  defaultLng?: number | null;
  defaultCity?: string | null;
  defaultProvince?: string | null;
  defaultPostalCode?: string | null;
  defaultCountry?: string | null;
  defaultPlaceId?: string | null;
  onResolved?: (data: {
    formatted: string;
    street?: string;
    lat: number | null;
    lng: number | null;
    city?: string;
    province?: string;
    postalCode?: string;
    country?: string;
    placeId?: string;
  }) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formattedRef = useRef<HTMLInputElement | null>(null);
  const latRef = useRef<HTMLInputElement | null>(null);
  const lngRef = useRef<HTMLInputElement | null>(null);
  const cityRef = useRef<HTMLInputElement | null>(null);
  const provinceRef = useRef<HTMLInputElement | null>(null);
  const postalRef = useRef<HTMLInputElement | null>(null);
  const countryRef = useRef<HTMLInputElement | null>(null);
  const placeIdRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const key =
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY;
    if (!key) return; // no key, render plain input
    if (window.google?.maps?.places) {
      init();
    } else {
      const el = document.createElement('script');
      el.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
      el.async = true;
      el.onload = init;
      document.head.appendChild(el);
      return () => {
        // no cleanup for script tag
      };
    }
  }, []);

  function init() {
    if (!inputRef.current || !window.google?.maps?.places) return;
    const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
      fields: [
        'formatted_address',
        'geometry',
        'place_id',
        'address_components',
      ],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const formatted = place.formatted_address || inputRef.current!.value;
      const lat = place.geometry?.location?.lat?.() ?? null;
      const lng = place.geometry?.location?.lng?.() ?? null;
      const comps = place.address_components || [];
      const get = (type: string) =>
        comps.find((c: any) => c.types?.includes(type))?.long_name || '';
      const city = get('locality') || get('postal_town') || '';
      const province = get('administrative_area_level_1') || '';
      const postalCode = get('postal_code') || '';
      const country = get('country') || '';
      const placeId = place.place_id || '';
      const streetNumber = get('street_number');
      const route = get('route');
      const street =
        [streetNumber, route].filter(Boolean).join(' ').trim() ||
        formatted.split(',')[0]?.trim() ||
        '';
      // Show street in the visible input so forms submit street-only
      if (inputRef.current) inputRef.current.value = street || formatted || '';
      if (formattedRef.current) formattedRef.current.value = formatted || '';
      if (latRef.current) latRef.current.value = lat != null ? String(lat) : '';
      if (lngRef.current) lngRef.current.value = lng != null ? String(lng) : '';
      if (cityRef.current) cityRef.current.value = city;
      if (provinceRef.current) provinceRef.current.value = province;
      if (postalRef.current) postalRef.current.value = postalCode;
      if (countryRef.current) countryRef.current.value = country;
      if (placeIdRef.current) placeIdRef.current.value = placeId;
      onResolved?.({
        formatted,
        street,
        lat,
        lng,
        city,
        province,
        postalCode,
        country,
        placeId,
      });
    });
  }

  return (
    <div>
      <input
        name={name}
        defaultValue={defaultValue}
        ref={inputRef}
        placeholder="Search address"
        className="border rounded-md w-full p-2"
      />
      {/* Hidden fields for formatted + coordinates + components */}
      <input
        type="hidden"
        name="propertyFormattedAddress"
        ref={formattedRef}
        defaultValue={defaultFormattedAddress ?? defaultValue}
      />
      <input
        type="hidden"
        name="propertyLat"
        ref={latRef}
        defaultValue={defaultLat != null ? String(defaultLat) : undefined}
      />
      <input
        type="hidden"
        name="propertyLng"
        ref={lngRef}
        defaultValue={defaultLng != null ? String(defaultLng) : undefined}
      />
      <input
        type="hidden"
        name="propertyCity"
        ref={cityRef}
        defaultValue={defaultCity ?? undefined}
      />
      <input
        type="hidden"
        name="propertyProvince"
        ref={provinceRef}
        defaultValue={defaultProvince ?? undefined}
      />
      <input
        type="hidden"
        name="propertyPostalCode"
        ref={postalRef}
        defaultValue={defaultPostalCode ?? undefined}
      />
      <input
        type="hidden"
        name="propertyCountry"
        ref={countryRef}
        defaultValue={defaultCountry ?? undefined}
      />
      <input
        type="hidden"
        name="propertyPlaceId"
        ref={placeIdRef}
        defaultValue={defaultPlaceId ?? undefined}
      />
    </div>
  );
}

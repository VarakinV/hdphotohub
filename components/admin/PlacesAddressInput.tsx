"use client";

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google?: any;
  }
}

export default function PlacesAddressInput({
  name = 'propertyAddress',
  defaultValue = '',
  onResolved,
}: {
  name?: string;
  defaultValue?: string;
  onResolved?: (data: { formatted: string; lat: number; lng: number }) => void;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const formattedRef = useRef<HTMLInputElement | null>(null);
  const latRef = useRef<HTMLInputElement | null>(null);
  const lngRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
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
      fields: ['formatted_address', 'geometry'],
    });
    ac.addListener('place_changed', () => {
      const place = ac.getPlace();
      const formatted = place.formatted_address || inputRef.current!.value;
      const lat = place.geometry?.location?.lat?.();
      const lng = place.geometry?.location?.lng?.();
      if (formattedRef.current) formattedRef.current.value = formatted || '';
      if (latRef.current) latRef.current.value = lat != null ? String(lat) : '';
      if (lngRef.current) lngRef.current.value = lng != null ? String(lng) : '';
      onResolved?.({ formatted, lat, lng });
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
      {/* Hidden fields for formatted + coordinates */}
      <input type="hidden" name="propertyFormattedAddress" ref={formattedRef} defaultValue={defaultValue} />
      <input type="hidden" name="propertyLat" ref={latRef} />
      <input type="hidden" name="propertyLng" ref={lngRef} />
    </div>
  );
}


'use client';

import React, { useEffect, useRef, useState } from 'react';

type Props = {
  lat?: number | null;
  lng?: number | null;
  zoom?: number;
  className?: string;
};

// Lightweight Google Map with a single marker.
// Uses JS API if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is available, otherwise falls back to an iframe embed.
export default function MapWithMarker({
  lat,
  lng,
  zoom = 15,
  className,
}: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Always call hooks. Perform side effects only when we have coords and an API key
  useEffect(() => {
    if (lat == null || lng == null || !apiKey) return;

    let marker: any = null;
    let map: any = null;

    function initMap() {
      if (!mapRef.current) return;
      const gmaps: any = (window as any).google?.maps;
      if (!gmaps) return;
      map = new gmaps.Map(mapRef.current, {
        center: { lat: Number(lat), lng: Number(lng) },
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      marker = new gmaps.Marker({
        position: { lat: Number(lat), lng: Number(lng) },
        map,
      });
      setInitialized(true);
    }

    function loadScript() {
      // If already loaded, initialize immediately
      if ((window as any).google?.maps) {
        initMap();
        return;
      }
      const existing = document.querySelector(
        '#google-maps-js,script[data-google-maps="true"],script[src*="maps.googleapis.com/maps/api/js"]'
      ) as HTMLScriptElement | null;
      if (existing) {
        if ((window as any).google?.maps) {
          initMap();
        } else {
          existing.addEventListener('load', initMap, { once: true });
          existing.addEventListener(
            'error',
            () => setError('Failed to load Google Maps'),
            { once: true }
          );
        }
      } else {
        const script = document.createElement('script');
        script.id = 'google-maps-js';
        script.async = true;
        script.defer = true;
        script.setAttribute('data-google-maps', 'true');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`;
        script.addEventListener('load', initMap, { once: true });
        script.addEventListener(
          'error',
          () => setError('Failed to load Google Maps'),
          { once: true }
        );
        document.head.appendChild(script);
      }
      // Resilience: fallback to iframe if the global never initializes (e.g., key restrictions)
      const fallbackTimer = window.setTimeout(() => {
        if (!(window as any).google?.maps && !initialized) {
          setError('Failed to initialize Google Maps');
        }
      }, 2500);
      return () => window.clearTimeout(fallbackTimer);
    }

    const cleanup = loadScript();
    return () => {
      if (marker) marker.setMap(null);
      if (map) map = null;
      if (typeof cleanup === 'function') cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, zoom, apiKey]);

  // Rendering flow below can return early (after hooks executed above)
  if (lat == null || lng == null) return null;

  // Fallback to iframe when API key is not provided or error happened
  if (!apiKey || error) {
    const src = `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
    return (
      <div className={className}>
        <iframe
          src={src}
          className="w-full h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    );
  }

  return <div ref={mapRef} className={className || 'w-full h-full'} />;
}

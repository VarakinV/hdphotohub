import { prisma } from "@/lib/db/prisma";

const CALGARY_CITY_CENTRE = { lat: 51.0447, lng: -114.0719 };

const DEFAULT_FLAT_FEE_TOWNS = [
  { cityName: "Chestermere", feeCents: 3000 },
  { cityName: "Airdrie", feeCents: 3000 },
  { cityName: "Okotoks", feeCents: 3000 },
  { cityName: "High River", feeCents: 3000 },
  { cityName: "Cochrane", feeCents: 3000 },
  { cityName: "Langdon", feeCents: 3000 },
];

const DEFAULT_PER_KM_RATE_CENTS = 85;
const DEFAULT_FREE_RADIUS_KM = 35;

export type TravelFeeConfig = {
  freeRadiusKm: number;
  perKmRateCents: number;
  flatFeeTowns: { cityName: string; feeCents: number }[];
};

const DEFAULT_CONFIG: TravelFeeConfig = {
  freeRadiusKm: DEFAULT_FREE_RADIUS_KM,
  perKmRateCents: DEFAULT_PER_KM_RATE_CENTS,
  flatFeeTowns: DEFAULT_FLAT_FEE_TOWNS,
};

function normalizeCity(city?: string | null): string {
  return (city || "").trim().toLowerCase();
}

function isCalgary(city?: string | null): boolean {
  return normalizeCity(city) === "calgary";
}

function findFlatFeeTown(city: string | null | undefined, towns: TravelFeeConfig["flatFeeTowns"]) {
  const normalized = normalizeCity(city);
  return towns.find((t) => normalizeCity(t.cityName) === normalized);
}

export async function getTravelFeeConfigForAdmin(adminId?: string | null): Promise<TravelFeeConfig> {
  if (!adminId) return DEFAULT_CONFIG;
  const [settings, activeTowns, townCount] = await Promise.all([
    prisma.adminBookingSettings.findUnique({ where: { adminId } }),
    prisma.adminTravelFlatFeeTown.findMany({ where: { adminId, active: true } }),
    prisma.adminTravelFlatFeeTown.count({ where: { adminId } }),
  ]);
  return {
    freeRadiusKm: settings?.travelFreeRadiusKm ?? DEFAULT_FREE_RADIUS_KM,
    perKmRateCents: settings?.travelPerKmRateCents ?? DEFAULT_PER_KM_RATE_CENTS,
    flatFeeTowns: townCount === 0 ? DEFAULT_FLAT_FEE_TOWNS : activeTowns,
  };
}

export type TravelFeeResult = {
  distanceMeters: number;
  durationSeconds: number;
  feeCents: number;
  rule: "FREE" | "FLAT" | "PER_KM";
  description: string;
  calculatedAt: string;
};

export async function calculateTravelFee(params: {
  lat: number | null;
  lng: number | null;
  city?: string | null;
  formattedAddress?: string | null;
  config?: TravelFeeConfig;
}): Promise<TravelFeeResult> {
  const { lat, lng, city } = params;
  const config = params.config ?? DEFAULT_CONFIG;

  // Default zero result
  const zeroResult = (description: string): TravelFeeResult => ({
    distanceMeters: 0,
    durationSeconds: 0,
    feeCents: 0,
    rule: "FREE",
    description,
    calculatedAt: new Date().toISOString(),
  });

  if (!lat || !lng) {
    return zeroResult("Address coordinates not available.");
  }

  // Rule 1: Calgary is always free
  if (isCalgary(city)) {
    return zeroResult("Free travel within Calgary.");
  }

  // Fetch one-way driving distance from Calgary City Centre
  const apiKey = process.env.GOOGLE_MAPS_SERVER_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn("[TRAVEL] No Google Maps server API key configured");
    return zeroResult("Travel fee calculation unavailable.");
  }

  let distanceMeters = 0;
  let durationSeconds = 0;

  try {
    const res = await fetch(
      "https://routes.googleapis.com/directions/v2:computeRoutes",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": apiKey,
          "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
        },
        body: JSON.stringify({
          origin: {
            location: {
              latLng: {
                latitude: CALGARY_CITY_CENTRE.lat,
                longitude: CALGARY_CITY_CENTRE.lng,
              },
            },
          },
          destination: {
            location: {
              latLng: {
                latitude: lat,
                longitude: lng,
              },
            },
          },
          travelMode: "DRIVE",
          routingPreference: "TRAFFIC_AWARE",
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => "Unknown error");
      console.warn("[TRAVEL] Routes API error:", res.status, text);
      return zeroResult("Travel fee calculation unavailable.");
    }

    const data = await res.json();
    const route = data?.routes?.[0];
    if (!route) {
      console.warn("[TRAVEL] No route returned from Routes API");
      return zeroResult("Travel fee calculation unavailable.");
    }

    distanceMeters = route.distanceMeters ?? 0;
    durationSeconds =
      typeof route.duration === "string"
        ? parseInt(route.duration.replace("s", ""), 10) || 0
        : 0;
  } catch (err) {
    console.warn("[TRAVEL] Failed to call Routes API:", err);
    return zeroResult("Travel fee calculation unavailable.");
  }

  const distanceKm = distanceMeters / 1000;

  // Rule 2: Flat fee towns
  const flatFeeTown = findFlatFeeTown(city, config.flatFeeTowns);
  if (flatFeeTown) {
    return {
      distanceMeters,
      durationSeconds,
      feeCents: flatFeeTown.feeCents,
      rule: "FLAT",
      description: `Flat travel fee for ${flatFeeTown.cityName}.`,
      calculatedAt: new Date().toISOString(),
    };
  }

  // Rule 3: Free within configured radius (non-Calgary but within radius)
  if (distanceKm <= config.freeRadiusKm) {
    return {
      distanceMeters,
      durationSeconds,
      feeCents: 0,
      rule: "FREE",
      description: `Within ${config.freeRadiusKm} km from City Centre. ${distanceKm.toFixed(
        1
      )} km one way.`,
      calculatedAt: new Date().toISOString(),
    };
  }

  // Rule 4: Per-km beyond configured radius
  const feeCents = Math.round(distanceKm * config.perKmRateCents);
  return {
    distanceMeters,
    durationSeconds,
    feeCents,
    rule: "PER_KM",
    description: `${distanceKm.toFixed(
      1
    )} km one way from City Centre × $${(config.perKmRateCents / 100).toFixed(
      2
    )}/km`,
    calculatedAt: new Date().toISOString(),
  };
}

export type TieredPriceTier = {
  quantity: number;
  priceCents: number;
};

export type TieredPricingConfig = {
  enabled?: boolean;
  unitLabel?: string | null;
  tiers?: TieredPriceTier[] | null;
};

export type PriceableService = {
  priceCents: number;
  isPerSqFt?: boolean | null;
  minPriceCents?: number | null;
  tieredPricing?: unknown;
};

export function normalizeTieredPricing(input: unknown) {
  if (!input || typeof input !== 'object') return null;
  const raw = input as TieredPricingConfig;
  if (raw.enabled === false) return null;

  const byQuantity = new Map<number, number>();
  for (const tier of Array.isArray(raw.tiers) ? raw.tiers : []) {
    const quantity = Math.trunc(Number(tier?.quantity));
    const priceCents = Math.round(Number(tier?.priceCents));
    if (quantity > 0 && priceCents >= 0) byQuantity.set(quantity, priceCents);
  }

  const tiers = [...byQuantity.entries()]
    .map(([quantity, priceCents]) => ({ quantity, priceCents }))
    .sort((a, b) => a.quantity - b.quantity);

  if (!tiers.length) return null;
  const unitLabel = String(raw.unitLabel || 'item').trim().slice(0, 40) || 'item';
  return { enabled: true, unitLabel, tiers };
}

export function sanitizeTieredPricingForStorage(input: unknown) {
  const normalized = normalizeTieredPricing(input);
  return normalized
    ? { enabled: true, unitLabel: normalized.unitLabel, tiers: normalized.tiers }
    : null;
}

export function resolveServiceQuantity(tieredPricing: unknown, requested?: unknown) {
  const config = normalizeTieredPricing(tieredPricing);
  if (!config) return 1;
  const requestedQuantity = Math.trunc(Number(requested));
  if (config.tiers.some((tier) => tier.quantity === requestedQuantity)) {
    return requestedQuantity;
  }
  return config.tiers[0]?.quantity ?? 1;
}

export function formatQuantityLabel(quantity: number, unitLabel?: string | null) {
  const label = String(unitLabel || 'item').trim() || 'item';
  const plural = quantity === 1 || label.endsWith('s') ? label : `${label}s`;
  return `${quantity} ${plural}`;
}

export function calculateServicePriceCents(
  service: PriceableService,
  propertySizeSqFt: number,
  requestedQuantity?: unknown
) {
  const tiered = normalizeTieredPricing(service.tieredPricing);
  if (tiered) {
    const quantity = resolveServiceQuantity(service.tieredPricing, requestedQuantity);
    const tier = tiered.tiers.find((item) => item.quantity === quantity) ?? tiered.tiers[0];
    return {
      priceCents: tier?.priceCents ?? service.priceCents,
      quantity,
      quantityLabel: tiered.unitLabel,
      isTiered: true,
    };
  }

  if (service.isPerSqFt && propertySizeSqFt > 0) {
    const computed = Math.round(service.priceCents * propertySizeSqFt);
    return {
      priceCents: Math.max(computed, service.minPriceCents ?? 0),
      quantity: 1,
      quantityLabel: null,
      isTiered: false,
    };
  }

  return {
    priceCents: service.priceCents,
    quantity: 1,
    quantityLabel: null,
    isTiered: false,
  };
}
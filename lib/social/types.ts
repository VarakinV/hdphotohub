export type SocialPostProperty = {
  address: string;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  bedrooms?: string | null;
  bathrooms?: string | null;
  sqft?: number | string | null;
  listPrice?: number | null;
  mlsNumber?: string | null;
};

export type SocialPostRealtor = {
  name: string;
  phone?: string | null;
  email?: string | null;
  companyName?: string | null;
  headshotUrl?: string | null;
  logoUrl?: string | null;
};

export type SocialPostInput = {
  variantKey: string;
  label?: string | null;
  images: string[]; // raw source image URLs (up to 6, will be downscaled to data URLs)
  property: SocialPostProperty;
  realtor: SocialPostRealtor;
  qrUrl?: string; // property page URL used for the QR code
  qrDataUrl?: string; // pre-rendered QR data URL (optional; generator may generate from qrUrl)
};

export type SocialPostRenderProps = {
  variantKey: string;
  label?: string | null;
  images: string[]; // data URLs, up to 6
  property: SocialPostProperty;
  realtor: SocialPostRealtor;
  qrDataUrl?: string;
};

export const POST_WIDTH = 1080;
export const POST_HEIGHT = 1350;

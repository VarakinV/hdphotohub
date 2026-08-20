import { z } from 'zod';

export const realtorSchema = z.object({
  name: z.string(),
  phone: z.string(),
  headshotUrl: z.string().url(),
  logoUrl: z.string().url(),
});

export type Realtor = z.infer<typeof realtorSchema>;

export const propertySchema = z.object({
  address: z.string(),
  street: z.string().optional(),
  city: z.string(),
  postalCode: z.string(),
  province: z.string().optional(),
  // Kept as strings when the listing provides them ("2+1", "2.5", "1,530").
  bedrooms: z.union([z.string(), z.number()]),
  bathrooms: z.union([z.string(), z.number()]),
  sqft: z.union([z.string(), z.number()]).optional(),
});

export type Property = z.infer<typeof propertySchema>;

export const reelPropsSchema = z.object({
  images: z.array(z.string().url()).min(3).max(6),
  property: propertySchema,
  realtor: realtorSchema,
  musicTrackUrl: z.string().url().optional(),
  variantKey: z.string(),
});

export type ReelProps = z.infer<typeof reelPropsSchema>;

export const slideshowPropsSchema = z.object({
  images: z.array(z.string().url()).min(3).max(6),
  property: propertySchema,
  realtor: realtorSchema,
  musicTrackUrl: z.string().url().optional(),
  variantKey: z.string(),
});

export type SlideshowProps = z.infer<typeof slideshowPropsSchema>;

export type VideoProps = ReelProps | SlideshowProps;

export const DEFAULT_DURATION_IN_FRAMES = 450;
export const DEFAULT_FPS = 30;

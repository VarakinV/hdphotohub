export type DeliveryPhoto = {
  id: string;
  url: string;
  urlMls: string | null;
  filename: string;
};

export type DeliveryVideo = {
  id: string;
  url: string;
  filename: string;
};

export type DeliveryReel = {
  id: string;
  url: string;
  thumbnail: string | null;
  variantKey: string;
  width: number | null;
  height: number | null;
  label: string;
};

export type DeliverySocialPost = {
  id: string;
  url: string;
  variantKey: string;
  caption: string;
};

export type DeliveryAiReel = {
  id: string;
  finalUrl: string;
  thumbnail: string | null;
  width: number | null;
  height: number | null;
  label: string;
};

export type DeliveryFloorPlan = {
  id: string;
  url: string;
  filename: string;
};

export type DeliveryAttachment = {
  id: string;
  url: string;
  filename: string;
};

export type DeliveryEmbed = {
  id: string;
  title: string;
  embedUrl: string;
};

export type DeliveryFlyer = {
  id: string;
  url: string;
  previewUrl: string | null;
  variantKey: string;
};

export type DeliveryWebsite = {
  variant: number;
  name: string;
  url: string;
  previewSrc: string;
};

export type DeliveryQrPrintable = {
  id: string;
  variantKey: string;
  label: string;
  displayId: string;
  pngUrl: string | null;
  pdfUrl: string | null;
};

export type DeliveryRealtor = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  headshot: string | null;
};

export type DeliveryPageData = {
  orderId: string;
  publicUrl: string;
  addressLine: string;
  cityLine: string;
  shootDate: string | null;
  heroUrl: string | null;
  realtor: DeliveryRealtor;
  photos: DeliveryPhoto[];
  videos: DeliveryVideo[];
  reels: DeliveryReel[];
  aiReels: DeliveryAiReel[];
  slideshows: DeliveryReel[];
  socialPosts: DeliverySocialPost[];
  floorPlans: DeliveryFloorPlan[];
  attachments: DeliveryAttachment[];
  embeds: DeliveryEmbed[];
  flyers: DeliveryFlyer[];
  websites: DeliveryWebsite[];
  qrPrintables: DeliveryQrPrintable[];
};

export type DeliveryNavItem = {
  id: string;
  label: string;
  count?: number;
};

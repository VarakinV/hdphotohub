'use client';

import { DownloadLinkButton } from '@/components/delivery/DownloadLinkButton';

export function QrDownloadCard({ qr }: { qr: any }) {
  const labelMap: Record<string, string> = {
    professional: 'Professional QR Code',
    modern: 'Modern QR Code',
    social: 'Social QR Code',
    custom: 'Custom QR Code',
  };
  const k = String(qr?.variantKey || '').toLowerCase();
  const label = labelMap[k] || (qr?.variantKey || '').toUpperCase();

  return (
    <div className="border rounded-md overflow-hidden">
      <div className="aspect-square bg-black/5 flex items-center justify-center p-6">
        {qr?.pngUrl ? (
          // Use image proxy for S3 to avoid CORS preview issues
          <img
            src={`/api/image/proxy?url=${encodeURIComponent(qr.pngUrl)}`}
            alt={label}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="text-gray-500 text-sm">Preview</div>
        )}
      </div>
      <div className="px-2 pt-2 text-xs text-gray-600 flex items-center justify-between">
        <span className="truncate">{label}</span>
      </div>
      <div className="p-2 grid grid-cols-2 gap-2">
        <DownloadLinkButton
          url={qr?.pngUrl || ''}
          label="PNG"
          fileName={`qr-${k}.png`}
          fullWidth={false}
        />
        <DownloadLinkButton
          url={qr?.pdfUrl || ''}
          label="PDF"
          fileName={`qr-${k}.pdf`}
          fullWidth={false}
        />
      </div>
    </div>
  );
}

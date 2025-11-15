"use client";
import { DownloadLinkButton } from '@/components/delivery/DownloadLinkButton';

export function FlyerPreviewCard({ flyer }: { flyer: any }) {
  const labelMap: Record<string, string> = {
    f1: 'Flyer 1',
    f2: 'Flyer 2',
    f3: 'Flyer 3',
  };
  return (
    <div className="border rounded-md overflow-hidden">
      <div className="aspect-[8.5/11] bg-black/5">
        {flyer.previewUrl ? (
          <img src={flyer.previewUrl} alt="Flyer preview" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm">Preview</div>
        )}
      </div>
      <div className="px-2 pt-2 text-xs text-gray-600 flex items-center justify-between">
        <span className="truncate">{labelMap[(flyer.variantKey || '').toLowerCase()] || (flyer.variantKey || '').toUpperCase()}</span>
        {flyer.pageWidth && flyer.pageHeight ? (
          <span className="ml-2 whitespace-nowrap">{flyer.pageWidth}×{flyer.pageHeight}</span>
        ) : null}
      </div>
      <div className="p-2 text-center">
        {flyer.url ? (
          <DownloadLinkButton url={flyer.url} label="Download" fileName={`flyer-${flyer.variantKey}.pdf`} />
        ) : (
          <div className="text-gray-500 text-sm">Processing...</div>
        )}
      </div>
    </div>
  );
}


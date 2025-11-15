'use client';

import { Button } from '@/components/ui/button';
import { Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';

export function CopyDeliveryLinkIcon({
  orderId,
  disabled,
}: {
  orderId: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/delivery/${orderId}`;

  async function onClick() {
    try {
      // Open delivery page in a new tab (keep this synchronous to preserve user-gesture context)
      window.open(url, '_blank', 'noopener,noreferrer');
      // Also copy the link to clipboard
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <Button
      type="button"
      size="icon"
      variant={copied ? 'default' : 'outline'}
      className={
        disabled
          ? 'opacity-50 pointer-events-none'
          : 'text-green-600 border-green-200'
      }
      onClick={onClick}
    >
      <LinkIcon className="h-4 w-4" />
    </Button>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export function CopyButton({
  text,
  label = 'Copy Link',
  copiedLabel = 'Copied!',
  size = 'default',
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <Button type="button" variant="outline" onClick={onCopy} size={size}>
      {copied ? copiedLabel : label}
    </Button>
  );
}

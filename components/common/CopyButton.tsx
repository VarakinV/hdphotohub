'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function CopyButton({
  text,
  label = 'Copy Link',
  copiedLabel = 'Copied!',
  size = 'default',
  icon,
  className,
}: {
  text: string;
  label?: string;
  copiedLabel?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  icon?: ReactNode;
  className?: string;
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
    <Button
      type="button"
      variant="outline"
      onClick={onCopy}
      size={size}
      className={className}
    >
      {icon ? (
        <span
          className={
            size === 'icon' || !label
              ? 'inline-flex items-center'
              : 'mr-2 inline-flex items-center'
          }
        >
          {icon}
        </span>
      ) : null}
      {copied ? copiedLabel : label}
    </Button>
  );
}

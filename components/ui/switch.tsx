'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  srLabel?: string;
  size?: 'sm' | 'md';
}

export function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  srLabel = 'Toggle',
  size = 'sm',
}: SwitchProps) {
  const track = size === 'md' ? 'h-8 w-14' : 'h-6 w-10';
  const thumb = size === 'md' ? 'h-7 w-7' : 'h-5 w-5';
  const translate =
    size === 'md'
      ? checked
        ? 'translate-x-6'
        : 'translate-x-1'
      : checked
      ? 'translate-x-5'
      : 'translate-x-1';
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={srLabel}
      disabled={disabled}
      onClick={() => !disabled && onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40',
        track,
        checked ? 'bg-green-500' : 'bg-gray-300',
        disabled && 'opacity-60 cursor-not-allowed',
        className
      )}
    >
      <span
        className={cn(
          'inline-block transform rounded-full bg-white shadow transition-transform',
          thumb,
          translate
        )}
      />
    </button>
  );
}

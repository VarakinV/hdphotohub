"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyButton({ text, label = "Copy Link", copiedLabel = "Copied!" }: { text: string; label?: string; copiedLabel?: string }) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <Button type="button" variant="outline" onClick={onCopy}>
      {copied ? copiedLabel : label}
    </Button>
  );
}


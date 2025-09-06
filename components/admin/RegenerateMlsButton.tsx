"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, ImageDown } from "lucide-react";
import { toast } from "sonner";

export function RegenerateMlsButton({ orderId }: { orderId: string }) {
  const [loading, setLoading] = useState(false);

  async function run() {
    try {
      setLoading(true);
      const res = await fetch(`/api/orders/${orderId}/media/photos/ensure-mls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyMissing: false })
      });
      if (!res.ok) throw new Error('Failed to regenerate MLS variants');
      const data = await res.json();
      toast.success(`Regenerated MLS for ${data.updated} photo(s)`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={run} disabled={loading}>
      {loading ? (<><Loader2 className="h-4 w-4 animate-spin"/> Regenerating...</>) : (<><ImageDown className="h-4 w-4"/> Regenerate MLS</>)}
    </Button>
  );
}


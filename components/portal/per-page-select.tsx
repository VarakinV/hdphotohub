'use client';

import { useRouter } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PerPageSelectProps {
  current: number;
  q?: string;
}

export function PerPageSelect({ current, q }: PerPageSelectProps) {
  const router = useRouter();

  return (
    <div className="flex items-center gap-2 text-sm text-gray-600">
      <span className="whitespace-nowrap">Show</span>
      <Select
        value={String(current)}
        onValueChange={(value) => {
          const params = new URLSearchParams();
          params.set('page', '1');
          params.set('perPage', value);
          if (q) params.set('q', q);
          router.push(`/portal/orders?${params.toString()}`);
        }}
      >
        <SelectTrigger className="w-[70px] h-8">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="10">10</SelectItem>
          <SelectItem value="20">20</SelectItem>
          <SelectItem value="50">50</SelectItem>
        </SelectContent>
      </Select>
      <span className="whitespace-nowrap">per page</span>
    </div>
  );
}


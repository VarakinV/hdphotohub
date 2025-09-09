'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type RoleFilter = 'ALL' | 'ADMIN' | 'REALTOR';

export function UsersFilters({
  initialQ = '',
  initialRole = '',
}: {
  initialQ?: string;
  initialRole?: '' | 'ADMIN' | 'REALTOR';
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = useState(initialQ);
  const [role, setRole] = useState<RoleFilter>(
    initialRole === 'ADMIN' || initialRole === 'REALTOR'
      ? (initialRole as RoleFilter)
      : 'ALL'
  );

  const updateParams = useCallback(
    (nextQ: string, nextRole: RoleFilter) => {
      const p = new URLSearchParams(sp?.toString());
      const qTrim = nextQ.trim();
      if (qTrim) p.set('q', qTrim);
      else p.delete('q');
      if (nextRole !== 'ALL') p.set('role', nextRole);
      else p.delete('role');
      p.set('page', '1');
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, sp]
  );

  useEffect(() => {
    const t = setTimeout(() => updateParams(q, role), 250);
    return () => clearTimeout(t);
  }, [q, role, updateParams]);

  return (
    <div className="flex items-center gap-2 w-full">
      <Input
        placeholder="Search name or email..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="w-full sm:w-72"
      />
      <Select value={role} onValueChange={(v) => setRole(v as RoleFilter)}>
        <SelectTrigger className="w-[160px]">
          <SelectValue placeholder="All roles" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All roles</SelectItem>
          <SelectItem value="ADMIN">ADMIN</SelectItem>
          <SelectItem value="REALTOR">REALTOR</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

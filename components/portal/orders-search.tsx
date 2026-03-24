"use client";

import { Input } from "@/components/ui/input";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function OrdersSearchInput({
  placeholder = "Search address...",
  initialQ = "",
  className,
}: {
  placeholder?: string;
  initialQ?: string;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(initialQ);
  const isUserTyping = useRef(false);

  const updateQuery = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams?.toString());
      if (next.trim()) params.set("q", next);
      else params.delete("q");
      // reset to first page on new query
      params.set("page", "1");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    },
    [router, pathname, searchParams]
  );

  // Only push to URL when the user is actively typing
  useEffect(() => {
    if (!isUserTyping.current) return;
    const t = setTimeout(() => {
      updateQuery(value);
      isUserTyping.current = false;
    }, 250);
    return () => clearTimeout(t);
  }, [value, updateQuery]);

  // Keep input in sync with external URL changes
  useEffect(() => {
    const currentQ = searchParams?.get("q") || "";
    if (currentQ !== value) setValue(currentQ);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <Input
      value={value}
      onChange={(e) => {
        isUserTyping.current = true;
        setValue(e.target.value);
      }}
      placeholder={placeholder}
      className={className}
    />
  );
}


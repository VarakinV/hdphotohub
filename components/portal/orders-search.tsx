"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";

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
    <div
      className={`flex items-center gap-2 rounded-[10px] border border-border bg-card px-3 py-2 text-faint ${
        className || ''
      }`}
    >
      <Search className="h-4 w-4 shrink-0" />
      <input
        value={value}
        onChange={(e) => {
          isUserTyping.current = true;
          setValue(e.target.value);
        }}
        placeholder={placeholder}
        aria-label="Search orders"
        className="w-full border-none bg-transparent text-[13.5px] text-foreground outline-none placeholder:text-faint"
      />
    </div>
  );
}


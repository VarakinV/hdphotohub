"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function LoginSuccessToaster() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const hasLogin = searchParams.get("loginSuccess");
    if (hasLogin) {
      toast.success("Login Successful");
      // Clean up the query param so it doesn't re-trigger
      const sp = new URLSearchParams(searchParams.toString());
      sp.delete("loginSuccess");
      const qs = sp.toString();
      router.replace(`${window.location.pathname}${qs ? `?${qs}` : ""}`);
    }
  }, [searchParams, router]);

  return <Toaster position="bottom-right" />;
}


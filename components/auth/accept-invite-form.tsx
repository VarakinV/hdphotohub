"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { signIn } from "next-auth/react";

const schema = z.object({
  name: z.string().optional(),
  password: z.string().min(8, "At least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { name: "" } });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || "Failed to accept invitation";
        if (data?.details && Array.isArray(data.details)) data.details.forEach((e: string) => toast.error(e));
        else toast.error(msg);
        return;
      }
      toast.success("Invitation accepted. Signing you in...");
      // sign in with the new credentials
      const email = data?.user?.email as string | undefined;
      const password = values.password;
      if (email) {
        const result = await signIn("credentials", { redirect: false, email, password });
        if (result?.ok) router.replace("/portal");
        else router.replace("/login");
      } else {
        router.replace("/login");
      }
    } catch (e) {
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md border rounded-lg p-6 shadow-sm bg-white">
        <h1 className="text-xl font-semibold mb-4">Accept Invitation</h1>
        <p className="text-sm text-gray-500 mb-6">Set your name (optional) and password to create your account.</p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input className="mt-1 w-full border rounded px-3 py-2" {...form.register("name")} placeholder="Your name" />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input className="mt-1 w-full border rounded px-3 py-2" type="password" {...form.register("password")} placeholder="********" />
            <p className="mt-1 text-xs text-gray-500">Must include upper, lower, number, and special character.</p>
          </div>
          <button disabled={submitting} className="w-full rounded bg-black text-white py-2 disabled:opacity-50">
            {submitting ? "Setting up..." : "Accept & Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}


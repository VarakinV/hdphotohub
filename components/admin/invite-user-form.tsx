"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InviteUserForm({
  action,
  defaultRole = "REALTOR",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaultRole?: "REALTOR" | "ADMIN";
}) {
  const [role, setRole] = useState<"REALTOR" | "ADMIN">(defaultRole);

  return (
    <form action={action} className="bg-white rounded-lg shadow p-4 space-y-3">
      <h2 className="font-medium">Invite a User</h2>
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end">
        <div className="flex-1 w-full">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="agent@example.com"
            className="mt-1"
          />
        </div>
        <div className="w-full md:w-auto">
          <Label htmlFor="role">Role</Label>
          <div className="mt-1">
            <Select value={role} onValueChange={(v) => setRole(v as any)}>
              <SelectTrigger id="role" className="w-[160px]">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="REALTOR">REALTOR</SelectItem>
                <SelectItem value="ADMIN">ADMIN</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Hidden input to submit role via server action */}
          <input type="hidden" name="role" value={role} />
        </div>
        <Button type="submit">Send Invite</Button>
      </div>
    </form>
  );
}


"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export interface AdminUserOption {
  id: string;
  label: string;
}

export function AssignRealtorAdmins({
  realtorId,
  admins,
  assignedAdminIds,
}: {
  realtorId: string;
  admins: AdminUserOption[];
  assignedAdminIds: string[];
}) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(assignedAdminIds);
  const assignedCount = selected.length;

  const adminMap = useMemo(() => new Set(assignedAdminIds), [assignedAdminIds]);

  async function save() {
    try {
      const next = new Set(selected);
      // compute diffs
      const toAdd: string[] = [];
      const toRemove: string[] = [];
      for (const a of selected) if (!adminMap.has(a)) toAdd.push(a);
      for (const a of adminMap) if (!next.has(a)) toRemove.push(a);

      await Promise.all([
        ...toAdd.map((adminId) =>
          fetch("/api/realtor-assignments", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ realtorId, adminId }),
          })
        ),
        ...toRemove.map((adminId) =>
          fetch("/api/realtor-assignments", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ realtorId, adminId }),
          })
        ),
      ]);
      toast.success("Assignments updated");
      setOpen(false);
    } catch (e) {
      toast.error("Failed to update assignments");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Assigned to Admin(s){assignedCount ? `: ${assignedCount}` : ""}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign Admins to Realtor</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 max-h-[50vh] overflow-auto pr-1">
          {admins.map((a) => {
            const checked = selected.includes(a.id);
            return (
              <label key={a.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={checked}
                  onChange={(e) => {
                    setSelected((prev) => {
                      const s = new Set(prev);
                      if (e.target.checked) s.add(a.id);
                      else s.delete(a.id);
                      return Array.from(s);
                    });
                  }}
                />
                <span className="text-sm">{a.label}</span>
              </label>
            );
          })}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={save}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


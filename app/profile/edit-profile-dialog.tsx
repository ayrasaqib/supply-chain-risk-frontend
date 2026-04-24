"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateUserProfile, fetchUserProfile } from "@/lib/auth-api";
import { useAuth } from "@/lib/auth-context";

export function EditProfileDialog() {
  const [open, setOpen] = useState(false);

  const [username, setUsername] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");

  const [loading, setLoading] = useState(false);
  const { refreshUser } = useAuth();

  useEffect(() => {
    if (!open) return;

    fetchUserProfile().then((data) => {
      setUsername(data.username || "");
      setCompany(data.company_name || "");
      setEmail(data.email || "");
    });
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateUserProfile({
        username,
        company_name: company,
      });

      await refreshUser();

      setOpen(false);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Edit Profile</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Username */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your display name"
            />
            <p className="text-xs text-muted-foreground"></p>
          </div>

          {/* Company */}
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Company Name
            </label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Optional"
            />
            <p className="text-xs text-muted-foreground"></p>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

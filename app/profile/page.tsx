"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { NavBar } from "@/components/ui/navbar";
import { useRouter } from "next/navigation";
import { useSupplyChain } from "@/lib/supply-chain-context";
import { Check } from "lucide-react";

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout } = useAuth();
  const { hubs } = useSupplyChain();
  const router = useRouter();

  const [watched, setWatched] = useState<string[]>([]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  const toggleWatch = (id: string) => {
    setWatched((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) return null;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAVBAR */}
      <NavBar variant="auth" />

      {/* CONTENT */}
      <main className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PROFILE */}
          <section className="rounded-xl border border-border bg-card/70 backdrop-blur p-6">
            <h2 className="text-lg font-semibold mb-4">Profile</h2>

            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                {user?.name?.[0]}
              </div>

              <div>
                <div className="font-medium">{user?.name}</div>
                <div className="text-sm text-muted-foreground">
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-muted-foreground">
              Plan: Starter
            </div>

            <Button className="mt-6">Edit Profile</Button>
          </section>

          {/* ALERTS (NOTIFICATIONS) */}
          <section className="rounded-xl border border-border bg-card/70 backdrop-blur p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Notifications</h2>
            </div>

            {/* EMPTY STATE */}
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="text-sm text-muted-foreground">
                You have no new notifications
              </div>
            </div>
          </section>

          {/* MONITORED HUBS */}
          <section className="md:col-span-2 rounded-xl border border-border bg-card/70 backdrop-blur p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold">Tracked Ports</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Notifications will be sent to your email for watched ports
                  with risk &gt; 0.6/1
                </p>
              </div>

              <Button size="sm" onClick={() => router.push("/dashboard")}>
                View on Map
              </Button>
            </div>

            <div className="mt-6 max-h-80 overflow-y-auto scrollbar-transparent pr-2 space-y-4 bg-transparent relative">
              {/* fade */}
              {hubs.map((hub) => {
                const isWatched = watched.includes(hub.id);

                return (
                  <div
                    key={hub.id}
                    className="rounded-lg border border-border p-4 flex justify-between items-center hover:bg-accent/40 transition"
                  >
                    {/* LEFT */}
                    <div>
                      <div className="font-medium">{hub.name}</div>

                      <div className="text-sm text-muted-foreground">
                        Risk:{" "}
                        <span
                          className={
                            hub.riskScore > 60
                              ? "text-red-400"
                              : hub.riskScore > 40
                                ? "text-orange-400"
                                : "text-green-400"
                          }
                        >
                          {hub.riskScore}
                        </span>
                      </div>
                    </div>

                    {/* RIGHT ACTIONS */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => toggleWatch(hub.id)}
                        variant={isWatched ? "secondary" : "default"}
                        className="gap-2"
                      >
                        {isWatched ? (
                          <>
                            <Check className="h-4 w-4" />
                            Watched
                          </>
                        ) : (
                          "Watch Hub"
                        )}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* SECURITY */}
          <section className="rounded-xl border border-border bg-card/70 backdrop-blur p-6">
            <h2 className="text-lg font-semibold mb-4">Security</h2>

            <div className="space-y-4">
              <Button variant="outline">Change Password</Button>

              <Button variant="destructive" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </section>

          {/* PREFERENCES */}
          <section className="rounded-xl border border-border bg-card/70 backdrop-blur p-6">
            <h2 className="text-lg font-semibold mb-4">Preferences</h2>

            <div className="text-sm text-muted-foreground">
              More settings coming soon...
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

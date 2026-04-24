"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { EditProfileDialog } from "./edit-profile-dialog";
import { ChangePasswordDialog } from "./change-password-dialog";
import {
  Bell,
  Check,
  ChevronsUpDown,
  Loader2,
  Mail,
  Map,
  MapPin,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  fetchDashboardSearchLocations,
  fetchDashboardHubRisk,
  type DashboardLocation,
} from "@/lib/dashboard-api";
import { WatchlistRiskTrendChart } from "@/components/watchlist-risk-trend-chart";
import { NavBar } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SupplyChainHub } from "@/lib/types";
import {
  fetchUserProfile,
  updateUserProfile,
  changePassword,
} from "@/lib/auth-api";

interface HubSearchOption extends DashboardLocation {
  id: string;
}

interface WatchlistMessage {
  id: string;
  title: string;
  body: string;
  timestamp?: string | null;
}

interface ApiErrorResponse {
  error?: string;
}

function getString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}

function normalizeWatchlistHubIds(payload: unknown): string[] {
  const extractHubId = (item: unknown) => {
    if (typeof item === "string") return item;
    if (typeof item === "object" && item !== null) {
      const record = item as Record<string, unknown>;
      return (
        getString(record.hub_id) ??
        getString(record.hubId) ??
        getString(record.id)
      );
    }

    return null;
  };

  const source = Array.isArray(payload)
    ? payload
    : typeof payload === "object" && payload !== null
      ? (((payload as Record<string, unknown>).hubs as unknown[]) ??
        ((payload as Record<string, unknown>).hub_ids as unknown[]) ??
        ((payload as Record<string, unknown>).watchlist as unknown[]) ??
        ((payload as Record<string, unknown>).items as unknown[]) ??
        [])
      : [];

  return Array.from(
    new Set(
      source
        .map(extractHubId)
        .filter((hubId): hubId is string => typeof hubId === "string"),
    ),
  );
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const rawBody = await response.text();
  let parsedBody: T | ApiErrorResponse | null = null;

  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody) as T | ApiErrorResponse;
    } catch {
      parsedBody = null;
    }
  }

  if (!response.ok) {
    const message =
      parsedBody &&
      typeof parsedBody === "object" &&
      "error" in parsedBody &&
      typeof parsedBody.error === "string"
        ? parsedBody.error
        : rawBody || `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return parsedBody as T;
}

async function fetchWatchlist(email: string) {
  const response = await fetchJson<unknown>(
    `/api/watchlist?email=${encodeURIComponent(email)}`,
  );
  return normalizeWatchlistHubIds(response);
}

async function subscribeToHub(hubId: string, email: string) {
  await fetchJson<unknown>(
    `/api/watchlist?hub_id=${encodeURIComponent(hubId)}&email=${encodeURIComponent(email)}`,
    { method: "POST" },
  );
}

async function unsubscribeFromHub(hubId: string, email: string) {
  await fetchJson<unknown>(
    `/api/watchlist?hub_id=${encodeURIComponent(hubId)}&email=${encodeURIComponent(email)}`,
    { method: "DELETE" },
  );
}

function HubSearchDropdown({
  hubs,
  value,
  onChange,
  placeholder,
  disabled,
}: {
  hubs: HubSearchOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedHub = hubs.find((hub) => hub.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
          disabled={disabled}
        >
          {selectedHub ? (
            <span className="truncate">{selectedHub.name}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        side="bottom"
        sideOffset={6}
        avoidCollisions={false}
      >
        <Command>
          <CommandInput placeholder="Search hub by name..." />
          <CommandList>
            <CommandEmpty>No hubs found.</CommandEmpty>
            <CommandGroup heading="Hubs">
              {hubs.map((hub) => (
                <CommandItem
                  key={hub.id}
                  value={`${hub.name} ${hub.country} ${hub.region} ${hub.id}`}
                  onSelect={() => {
                    onChange(hub.id);
                    setOpen(false);
                  }}
                  className="flex cursor-pointer items-center gap-3"
                >
                  <Check
                    className={cn(
                      "h-4 w-4",
                      value === hub.id ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{hub.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {hub.country} • {hub.region}
                    </p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function getRiskColor(score: number | null | undefined) {
  if (score === null || score === undefined) return "text-muted-foreground";
  if (score < 30) return "text-emerald-400";
  if (score < 50) return "text-amber-400";
  if (score < 70) return "text-orange-400";
  return "text-red-400";
}

export default function ProfilePage() {
  const { user, isLoading: authLoading, logout, deleteAccount } = useAuth();
  const router = useRouter();
  const [allHubs, setAllHubs] = useState<HubSearchOption[]>([]);
  const [watchlistHubIds, setWatchlistHubIds] = useState<string[]>([]);
  const [messages, setMessages] = useState<WatchlistMessage[]>([]);
  const [selectedHubId, setSelectedHubId] = useState("");
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedHubId, setExpandedHubId] = useState<string | null>(null);
  const [riskDetailsByHubId, setRiskDetailsByHubId] = useState<
    Record<string, SupplyChainHub>
  >({});
  const [loadingRiskHubId, setLoadingRiskHubId] = useState<string | null>(null);
  const [isLoadingTrendData, setIsLoadingTrendData] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [profile, setProfile] = useState<{
    username?: string;
    email?: string;
    company_name?: string;
  } | null>(null);

  const [loadingProfileData, setLoadingProfileData] = useState(true);

  const email = user?.email ?? "";

  useEffect(() => {
    if (!user) return;

    setLoadingProfileData(true);

    fetchUserProfile()
      .then((data: any) => {
        setProfile(data);
      })
      .catch((err) => {
        console.error("Profile load failed:", err);
        setProfile(null);
      })
      .finally(() => {
        setLoadingProfileData(false);
      });
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  useEffect(() => {
    if (!user) return;

    setMessages([]);
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;

    setIsLoadingProfile(true);
    setError(null);

    void Promise.all([
      fetchDashboardSearchLocations(),
      fetchWatchlist(user.email),
    ])
      .then(([locations, watchlist]) => {
        setAllHubs(
          locations.map((location) => ({
            ...location,
            id: location.hub_id,
          })),
        );
        setWatchlistHubIds(watchlist);
      })
      .catch((loadError) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load profile watchlist data.",
        );
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [user]);

  const selectedHub = useMemo(
    () => allHubs.find((hub) => hub.id === selectedHubId) ?? null,
    [allHubs, selectedHubId],
  );

  const watchlistHubs = useMemo(
    () =>
      watchlistHubIds
        .map((hubId) => allHubs.find((hub) => hub.id === hubId))
        .filter((hub): hub is HubSearchOption => hub !== undefined),
    [allHubs, watchlistHubIds],
  );

  const selectedHubIsSubscribed = selectedHub
    ? watchlistHubIds.includes(selectedHub.id)
    : false;

  const watchlistRiskTrendHubs = useMemo(
    () =>
      watchlistHubs
        .map((hub) => riskDetailsByHubId[hub.id])
        .filter((hub): hub is SupplyChainHub => hub !== undefined),
    [riskDetailsByHubId, watchlistHubs],
  );

  const refreshWatchlistData = async () => {
    if (!email) return;

    const watchlist = await fetchWatchlist(email);

    setWatchlistHubIds(watchlist);
  };

  const handleToggleRisk = async (hub: HubSearchOption) => {
    if (expandedHubId === hub.id) {
      setExpandedHubId(null);
      return;
    }

    setExpandedHubId(hub.id);
    setError(null);

    if (riskDetailsByHubId[hub.id]) {
      return;
    }

    setLoadingRiskHubId(hub.id);

    try {
      const riskHub =
        riskDetailsByHubId[hub.id] ?? (await fetchDashboardHubRisk(hub));
      setRiskDetailsByHubId((current) => ({
        ...current,
        [hub.id]: riskHub,
      }));
    } catch (riskError) {
      setError(
        riskError instanceof Error
          ? riskError.message
          : "Failed to load risk details for this hub.",
      );
    } finally {
      setLoadingRiskHubId(null);
    }
  };

  useEffect(() => {
    const missingHubs = watchlistHubs.filter(
      (hub) => !riskDetailsByHubId[hub.id],
    );

    if (missingHubs.length === 0) {
      return;
    }

    let cancelled = false;
    setIsLoadingTrendData(true);

    void Promise.allSettled(
      missingHubs.map(async (hub) => ({
        hubId: hub.id,
        riskHub: await fetchDashboardHubRisk(hub),
      })),
    )
      .then((results) => {
        if (cancelled) {
          return;
        }

        setRiskDetailsByHubId((current) => {
          const next = { ...current };

          for (const result of results) {
            if (result.status === "fulfilled") {
              next[result.value.hubId] = result.value.riskHub;
            }
          }

          return next;
        });
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoadingTrendData(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [riskDetailsByHubId, watchlistHubs]);

  const handleSubscribe = async () => {
    if (!selectedHub || !email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await subscribeToHub(selectedHub.id, email);
      await refreshWatchlistData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to subscribe to this hub.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnsubscribe = async (hubId: string) => {
    if (!email) return;

    setIsSubmitting(true);
    setError(null);

    try {
      await unsubscribeFromHub(hubId, email);
      await refreshWatchlistData();
      if (selectedHubId === hubId) {
        setSelectedHubId("");
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to unsubscribe from this hub.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar
        actions={[
          {
            href: "/dashboard",
            label: "Dashboard",
            icon: <Map className="h-4 w-4" />,
          },
        ]}
      />

      <main className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <section className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold">Profile</h2>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                {user.name?.[0]}
              </div>

              <div>
                <div className="font-medium">
                  {profile?.username || user.name}
                </div>

                <div className="text-sm text-muted-foreground">
                  {profile?.email || user.email}
                </div>

                <div className="mt-2 text-sm text-muted-foreground">
                  Company: {profile?.company_name || "Not set"}
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-muted-foreground">
              Plan: Starter
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <EditProfileDialog />
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Notifications</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Watchlist alert messages sent for your subscribed hubs.
                </p>
              </div>
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>

            {isLoadingProfile ? (
              <div className="flex min-h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex min-h-40 flex-col items-center justify-center text-center">
                <Mail className="mb-3 h-8 w-8 text-muted-foreground/50" />
                <div className="text-sm text-muted-foreground">
                  You have no watchlist notifications yet.
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className="rounded-lg border border-border/60 bg-background/50 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{message.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {message.body}
                        </p>
                      </div>
                      {message.timestamp && (
                        <Badge variant="secondary" className="shrink-0">
                          {message.timestamp}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="md:col-span-2 rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Watchlist</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search any monitored hub, subscribe to add it to your
                  watchlist, and unsubscribe to remove it.
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
              <Card className="border-border/60 bg-background/40">
                <CardHeader>
                  <CardTitle className="text-base">Add Hub</CardTitle>
                  <CardDescription>
                    Search the monitored hub list and manage your subscription.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <HubSearchDropdown
                    hubs={allHubs}
                    value={selectedHubId}
                    onChange={setSelectedHubId}
                    placeholder={
                      isLoadingProfile ? "Loading hubs..." : "Search for a hub"
                    }
                    disabled={isLoadingProfile || isSubmitting}
                  />

                  {selectedHub && (
                    <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium">{selectedHub.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {selectedHub.country} • {selectedHub.region}
                          </p>
                        </div>
                        <Badge variant="secondary">
                          {selectedHubIsSubscribed
                            ? "Subscribed"
                            : "Not subscribed"}
                        </Badge>
                      </div>

                      <div className="mt-4">
                        <Button
                          onClick={handleSubscribe}
                          disabled={isSubmitting || selectedHubIsSubscribed}
                          className="w-full"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            "Subscribe"
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border/60 bg-background/40">
                <CardHeader>
                  <CardTitle className="text-base">Subscribed Hubs</CardTitle>
                  <CardDescription>
                    These hubs are currently on your watchlist.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingProfile ? (
                    <div className="flex min-h-48 items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    </div>
                  ) : watchlistHubs.length === 0 ? (
                    <div className="flex min-h-48 flex-col items-center justify-center text-center">
                      <MapPin className="mb-3 h-8 w-8 text-muted-foreground/50" />
                      <p className="text-sm text-muted-foreground">
                        You have not subscribed to any hubs yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <WatchlistRiskTrendChart
                        hubs={watchlistRiskTrendHubs}
                        isLoading={isLoadingTrendData}
                      />

                      {watchlistHubs.map((hub) => (
                        <div
                          key={hub.id}
                          className="rounded-lg border border-border/60 bg-background/60 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{hub.name}</p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                {hub.country} • {hub.region}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => void handleToggleRisk(hub)}
                                disabled={loadingRiskHubId === hub.id}
                                className="min-w-[7.5rem] gap-2"
                              >
                                {loadingRiskHubId === hub.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Loading...
                                  </>
                                ) : expandedHubId === hub.id ? (
                                  "Hide Risk"
                                ) : (
                                  "View Risk"
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => void handleUnsubscribe(hub.id)}
                                disabled={isSubmitting}
                                className="min-w-[7.5rem] gap-2"
                              >
                                <Trash2 className="h-4 w-4" />
                                Unsubscribe
                              </Button>
                            </div>
                          </div>

                          {expandedHubId === hub.id && (
                            <div className="mt-4 grid gap-3 rounded-lg border border-border/60 bg-background/70 p-4 sm:grid-cols-3">
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Risk Score
                                </p>
                                <p
                                  className={cn(
                                    "mt-1 text-lg font-semibold",
                                    getRiskColor(
                                      riskDetailsByHubId[hub.id]?.riskScore,
                                    ),
                                  )}
                                >
                                  {riskDetailsByHubId[hub.id]?.riskScore ?? "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Weather
                                </p>
                                <p
                                  className={cn(
                                    "mt-1 text-lg font-semibold",
                                    getRiskColor(
                                      riskDetailsByHubId[hub.id]?.apiRiskFactors
                                        ?.weather.score ??
                                        riskDetailsByHubId[hub.id]?.riskFactors
                                          .weather.score,
                                    ),
                                  )}
                                >
                                  {riskDetailsByHubId[hub.id]?.apiRiskFactors
                                    ?.weather.score ??
                                    riskDetailsByHubId[hub.id]?.riskFactors
                                      .weather.score ??
                                    "—"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                  Geopolitical
                                </p>
                                <p
                                  className={cn(
                                    "mt-1 text-lg font-semibold",
                                    getRiskColor(
                                      riskDetailsByHubId[hub.id]?.apiRiskFactors
                                        ?.geopolitical.score ??
                                        riskDetailsByHubId[hub.id]?.riskFactors
                                          .geopolitical.score,
                                    ),
                                  )}
                                >
                                  {riskDetailsByHubId[hub.id]?.apiRiskFactors
                                    ?.geopolitical.score ??
                                    riskDetailsByHubId[hub.id]?.riskFactors
                                      .geopolitical.score ??
                                    "—"}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold">Security</h2>

            <div className="space-y-4">
              <ChangePasswordDialog />

              <Button
                variant="destructive"
                onClick={async () => {
                  const confirmed = window.confirm(
                    "This will permanently delete your account. This action cannot be undone.",
                  );

                  if (!confirmed) return;

                  try {
                    await deleteAccount(); // from useAuth()
                    router.push("/login");
                  } catch (err) {
                    console.error("Failed to delete account:", err);
                  }
                }}
              >
                Delete Account
              </Button>

              <Button variant="destructive" onClick={handleLogout}>
                Log Out
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card/70 p-6 backdrop-blur">
            <h2 className="mb-4 text-lg font-semibold">Preferences</h2>

            <div className="text-sm text-muted-foreground">
              More settings coming soon...
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

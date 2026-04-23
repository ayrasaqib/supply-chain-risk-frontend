"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupplyChainHub } from "@/lib/types";

function buildForecastPayload(hubs: SupplyChainHub[]) {
  return hubs
    .filter((hub) => hub.weeklyForecast.length > 0)
    .map((hub) => ({
      hubId: hub.id,
      hubName: hub.name,
      forecast: hub.weeklyForecast.slice(0, 7).map((day) => ({
        date: day.date.toISOString(),
        riskScore: day.weather?.score ?? day.riskScore,
      })),
    }))
    .filter((hub) => hub.forecast.length > 0);
}

export function WatchlistRiskTrendChart({
  hubs,
  isLoading = false,
}: {
  hubs: SupplyChainHub[];
  isLoading?: boolean;
}) {
  const [graphUrl, setGraphUrl] = useState<string | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);

  const payload = useMemo(() => buildForecastPayload(hubs), [hubs]);

  useEffect(() => {
    if (payload.length === 0) {
      setGraphUrl(null);
      setGraphError(null);
      return;
    }

    const controller = new AbortController();

    const loadGraph = async () => {
      setIsLoadingGraph(true);
      setGraphError(null);

      try {
        const response = await fetch("/api/visualise/watchlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ hubs: payload }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errorBody = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;
          throw new Error(
            errorBody?.error ?? `Request failed with status ${response.status}`
          );
        }

        const body = (await response.json()) as { url?: string | null };
        setGraphUrl(body.url ?? null);

        if (!body.url) {
          setGraphError("Visualization API returned no graph URL.");
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setGraphUrl(null);
        setGraphError(
          error instanceof Error ? error.message : "Failed to load visualisation."
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingGraph(false);
        }
      }
    };

    void loadGraph();

    return () => {
      controller.abort();
    };
  }, [payload]);

  if (isLoading && payload.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-border/60 bg-background/40">
        <p className="text-sm text-muted-foreground">Loading weather risk trends...</p>
      </div>
    );
  }

  if (payload.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center rounded-xl border border-dashed border-border/60 bg-background/30 px-6 text-center">
        <p className="text-sm text-muted-foreground">
          Weekly risk trends will appear here once subscribed hubs have forecast data.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Weekly Weather Risk Trend</h3>
        <p className="text-xs text-muted-foreground">
          Visualised daily weather risk score across your subscribed hubs.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-lg border border-slate-800 bg-slate-950">
        {isLoadingGraph || (isLoading && !graphUrl) ? (
          <div className="flex h-[300px] items-center justify-center px-4 text-center text-sm text-slate-400">
            Loading visualisation...
          </div>
        ) : graphUrl ? (
          <img
            src={graphUrl}
            alt="Weather risk trend visualisation for subscribed hubs"
            className="block h-[300px] w-full bg-white object-contain sm:h-[340px]"
          />
        ) : (
          <div className="flex h-[220px] items-center justify-center px-4 text-center text-sm text-amber-100">
            {graphError ?? "No visualisation available."}
          </div>
        )}
      </div>
    </div>
  );
}

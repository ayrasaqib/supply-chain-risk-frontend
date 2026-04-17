"use client";

import { createContext, useContext, useState, useEffect } from "react";
import {
  generateSupplyChainData,
  calculateRiskSummary,
} from "@/lib/supply-chain-data";
import type { SupplyChainHub, RiskSummary } from "@/lib/types";

type SupplyChainContextType = {
  hubs: SupplyChainHub[];
  summary: RiskSummary | null;
  refresh: () => void;
  loading: boolean;
};

const SupplyChainContext = createContext<SupplyChainContextType | null>(null);

export function SupplyChainProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hubs, setHubs] = useState<SupplyChainHub[]>([]);
  const [summary, setSummary] = useState<RiskSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    setLoading(true);
    const data = generateSupplyChainData();
    setHubs(data);
    setSummary(calculateRiskSummary(data));
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const refresh = () => loadData();

  return (
    <SupplyChainContext.Provider value={{ hubs, summary, refresh, loading }}>
      {children}
    </SupplyChainContext.Provider>
  );
}

export function useSupplyChain() {
  const ctx = useContext(SupplyChainContext);
  if (!ctx) throw new Error("useSupplyChain must be used inside provider");
  return ctx;
}

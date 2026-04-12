import dynamic from "next/dynamic";
import type { SupplyChainHub } from "@/lib/types";
import { generateSupplyChainData } from "@/lib/supply-chain-data";

export const demoHubs: SupplyChainHub[] = generateSupplyChainData();
export const SupplyChainMap = dynamic(
  () =>
    import("@/components/supply-chain-map").then((mod) => mod.SupplyChainMap),
  { ssr: false },
);

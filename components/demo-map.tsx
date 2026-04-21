import dynamic from "next/dynamic";
import type { SupplyChainHub } from "@/lib/types";
import { generateCustomHubData } from "@/lib/supply-chain-data";

const MOCK_HUBS = [
  { name: "Pacific Gateway", latitude: 35.1, longitude: 129.04, type: "port" },
  { name: "Shanghai East Terminal", latitude: 31.23, longitude: 121.47, type: "port" },
  { name: "Pearl River Hub", latitude: 22.54, longitude: 114.05, type: "port" },
  { name: "Singapore Logistics Bay", latitude: 1.26, longitude: 103.82, type: "port" },
  { name: "Tokyo Freight Hub", latitude: 35.62, longitude: 139.77, type: "port" },
  { name: "Osaka Harbor Link", latitude: 34.67, longitude: 135.43, type: "port" },
  { name: "Kaohsiung Cargo Terminal", latitude: 22.62, longitude: 120.3, type: "port" },
  { name: "Manila Container Point", latitude: 14.58, longitude: 120.97, type: "port" },
  { name: "Ho Chi Minh Cargo Hub", latitude: 10.82, longitude: 106.62, type: "distribution-center" },
  { name: "Mumbai Coastal Terminal", latitude: 18.95, longitude: 72.95, type: "port" },
  { name: "Chennai Gateway", latitude: 13.08, longitude: 80.29, type: "port" },
  { name: "Colombo Transshipment Hub", latitude: 6.95, longitude: 79.84, type: "port" },
  { name: "Dubai Freeport", latitude: 25.01, longitude: 55.05, type: "port" },
  { name: "Doha Air Freight", latitude: 25.27, longitude: 51.61, type: "airport" },
  { name: "Dammam Trade Terminal", latitude: 26.43, longitude: 50.1, type: "port" },
  { name: "Rotterdam West Dock", latitude: 51.9, longitude: 4.46, type: "port" },
  { name: "Hamburg North Terminal", latitude: 53.54, longitude: 9.96, type: "port" },
  { name: "Mediterranean Cargo Link", latitude: 37.94, longitude: 23.63, type: "port" },
  { name: "Valencia Shipping Point", latitude: 39.45, longitude: -0.32, type: "port" },
  { name: "Antwerp Freight Exchange", latitude: 51.26, longitude: 4.4, type: "port" },
  { name: "Le Havre Supply Port", latitude: 49.49, longitude: 0.1, type: "port" },
  { name: "Atlantic Distribution Hub", latitude: 40.66, longitude: -74.04, type: "distribution-center" },
  { name: "Los Angeles Marine Gateway", latitude: 33.73, longitude: -118.26, type: "port" },
  { name: "Gulf Coast Transfer Point", latitude: 29.73, longitude: -95.26, type: "distribution-center" },
  { name: "Vancouver Pacific Port", latitude: 49.29, longitude: -123.1, type: "port" },
  { name: "Chicago Rail Freight", latitude: 41.88, longitude: -87.63, type: "distribution-center" },
  { name: "Savannah Export Terminal", latitude: 32.08, longitude: -81.09, type: "port" },
  { name: "Mexico Pacific Node", latitude: 19.2, longitude: -104.33, type: "port" },
  { name: "Santos South Dock", latitude: -23.98, longitude: -46.28, type: "port" },
  { name: "Panama Canal Transfer", latitude: 9.35, longitude: -79.9, type: "port" },
  { name: "Buenos Aires Cargo Port", latitude: -34.6, longitude: -58.37, type: "port" },
  { name: "Andes Air Freight", latitude: -12.02, longitude: -77.11, type: "airport" },
  { name: "Cape Logistics Point", latitude: -33.91, longitude: 18.42, type: "port" },
  { name: "Durban Container Hub", latitude: -29.85, longitude: 31.02, type: "port" },
  { name: "East Africa Relay", latitude: -6.79, longitude: 39.28, type: "port" },
  { name: "Lagos Inland Gateway", latitude: 6.45, longitude: 3.39, type: "distribution-center" },
  { name: "Mombasa Port Link", latitude: -4.04, longitude: 39.67, type: "port" },
  { name: "Melbourne Trade Terminal", latitude: -37.82, longitude: 144.91, type: "port" },
  { name: "Sydney Air Cargo", latitude: -33.94, longitude: 151.17, type: "airport" },
  { name: "Auckland Ocean Freight", latitude: -36.84, longitude: 174.76, type: "port" },
  { name: "Perth Supply Node", latitude: -31.95, longitude: 115.86, type: "distribution-center" },
] as const;

export const demoHubs: SupplyChainHub[] = MOCK_HUBS.map((hub, index) => ({
  ...generateCustomHubData(hub.name, hub.latitude, hub.longitude, hub.type),
  id: `demo-hub-${index + 1}`,
}));
export const SupplyChainMap = dynamic(
  () =>
    import("@/components/supply-chain-map").then((mod) => mod.SupplyChainMap),
  { ssr: false },
);

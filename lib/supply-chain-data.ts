import type { SupplyChainHub, RiskSummary, HubType, RiskFactors } from "./types"
import {
  calculateCompositeRisk,
  getRiskLevel,
  generateWeatherRisk,
  generateLogisticsRisk,
  generateGeopoliticalRisk,
  generateAlerts,
  generateWeeklyForecast,
} from "./risk-calculator"

interface HubDefinition {
  id: string
  name: string
  location: { latitude: number; longitude: number }
  country: string
  region: string
  type: HubType
}

// Global major port locations
const HUB_DEFINITIONS: HubDefinition[] = [
  {
    id: "shanghai",
    name: "Port of Shanghai",
    location: { latitude: 31.2304, longitude: 121.4737 },
    country: "China",
    region: "East Asia",
    type: "port",
  },
  {
    id: "singapore",
    name: "Port of Singapore",
    location: { latitude: 1.2644, longitude: 103.8222 },
    country: "Singapore",
    region: "Southeast Asia",
    type: "port",
  },
  {
    id: "rotterdam",
    name: "Port of Rotterdam",
    location: { latitude: 51.9054, longitude: 4.4661 },
    country: "Netherlands",
    region: "Europe",
    type: "port",
  },
  {
    id: "los-angeles",
    name: "Port of Los Angeles",
    location: { latitude: 33.7361, longitude: -118.2631 },
    country: "United States",
    region: "North America",
    type: "port",
  },
  {
    id: "shenzhen",
    name: "Port of Shenzhen",
    location: { latitude: 22.5431, longitude: 114.0579 },
    country: "China",
    region: "East Asia",
    type: "port",
  },
  {
    id: "busan",
    name: "Port of Busan",
    location: { latitude: 35.1028, longitude: 129.0403 },
    country: "South Korea",
    region: "East Asia",
    type: "port",
  },
  {
    id: "hong-kong",
    name: "Port of Hong Kong",
    location: { latitude: 22.2855, longitude: 114.158 },
    country: "Hong Kong",
    region: "East Asia",
    type: "port",
  },
  {
    id: "dubai",
    name: "Jebel Ali Port",
    location: { latitude: 25.0152, longitude: 55.0587 },
    country: "UAE",
    region: "Middle East",
    type: "port",
  },
  {
    id: "hamburg",
    name: "Port of Hamburg",
    location: { latitude: 53.5461, longitude: 9.9663 },
    country: "Germany",
    region: "Europe",
    type: "port",
  },
  
  {
    id: "new-york",
    name: "Port of New York/New Jersey",
    location: { latitude: 40.6699, longitude: -74.0454 },
    country: "United States",
    region: "North America",
    type: "port",
  },
  {
    id: "melbourne",
    name: "Port of Melbourne",
    location: { latitude: -37.8226, longitude: 144.9127 },
    country: "Australia",
    region: "Oceania",
    type: "port",
  },
  {
    id: "durban",
    name: "Port of Durban",
    location: { latitude: -29.8587, longitude: 31.0218 },
    country: "South Africa",
    region: "Africa",
    type: "port",
  },
  
  {
    id: "tokyo",
    name: "Port of Tokyo",
    location: { latitude: 35.6284, longitude: 139.7745 },
    country: "Japan",
    region: "East Asia",
    type: "port",
  },
  {
    id: "mumbai",
    name: "Jawaharlal Nehru Port",
    location: { latitude: 18.9509, longitude: 72.9503 },
    country: "India",
    region: "South Asia",
    type: "port",
  },
  {
    id: "santos",
    name: "Port of Santos",
    location: { latitude: -23.9822, longitude: -46.2892 },
    country: "Brazil",
    region: "South America",
    type: "port",
  },
]

// Generate hub data with simulated risk factors
function generateHubData(definition: HubDefinition): SupplyChainHub {
  const weatherRisk = generateWeatherRisk(definition.region)
  const logisticsRisk = generateLogisticsRisk(definition.type)
  const geopoliticalRisk = generateGeopoliticalRisk(definition.region)

  const riskFactors: RiskFactors = {
    weather: weatherRisk,
    logistics: logisticsRisk,
    geopolitical: geopoliticalRisk,
  }

  const riskScore = calculateCompositeRisk(riskFactors)
  const riskLevel = getRiskLevel(riskScore)
  const alerts = generateAlerts(riskFactors)
  const weeklyForecast = generateWeeklyForecast(definition.region)

  return {
    ...definition,
    riskScore,
    riskLevel,
    riskFactors,
    weeklyForecast,
    lastUpdated: new Date(),
    alerts,
  }
}

// Generate all hub data - call this to get fresh simulated data
export function generateSupplyChainData(): SupplyChainHub[] {
  return HUB_DEFINITIONS.map(generateHubData)
}

// Calculate summary statistics from hub data
export function calculateRiskSummary(hubs: SupplyChainHub[]): RiskSummary {
  const summary: RiskSummary = {
    totalHubs: hubs.length,
    lowRisk: 0,
    elevatedRisk: 0,
    highRisk: 0,
    criticalRisk: 0,
    averageRisk: 0,
    lastUpdated: new Date(),
  }

  let totalRisk = 0

  for (const hub of hubs) {
    totalRisk += hub.riskScore

    switch (hub.riskLevel) {
      case "low":
        summary.lowRisk++
        break
      case "elevated":
        summary.elevatedRisk++
        break
      case "high":
        summary.highRisk++
        break
      case "critical":
        summary.criticalRisk++
        break
    }
  }

  summary.averageRisk = Math.round(totalRisk / hubs.length)

  return summary
}

// Get hub definitions for static purposes
export function getHubDefinitions(): HubDefinition[] {
  return HUB_DEFINITIONS
}

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
  let availableRiskCount = 0

  for (const hub of hubs) {
    if (hub.riskDataAvailable === false) {
      continue
    }

    totalRisk += hub.riskScore
    availableRiskCount++

    const computedRiskLevel = getRiskLevel(hub.riskScore)

    switch (computedRiskLevel) {
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

  summary.averageRisk = availableRiskCount > 0 ? Math.round(totalRisk / availableRiskCount) : 0

  return summary
}

// Determine region from coordinates
export function getRegionFromCoordinates(latitude: number, longitude: number): string {
  // Simplified region detection based on coordinates
  if (latitude >= 20 && latitude <= 55 && longitude >= 100 && longitude <= 150) {
    return "East Asia"
  }
  if (latitude >= -10 && latitude < 20 && longitude >= 95 && longitude <= 140) {
    return "Southeast Asia"
  }
  if (latitude >= 35 && latitude <= 70 && longitude >= -10 && longitude <= 40) {
    return "Europe"
  }
  if (latitude >= 15 && latitude <= 75 && longitude >= -170 && longitude <= -50) {
    return "North America"
  }
  if (latitude >= 10 && latitude <= 45 && longitude >= 30 && longitude <= 75) {
    return "Middle East"
  }
  if (latitude >= -10 && latitude <= 35 && longitude >= 65 && longitude <= 100) {
    return "Southeast Asia"
  }
  if (latitude >= -60 && latitude <= 15 && longitude >= -85 && longitude <= -30) {
    return "South America"
  }
  if (latitude >= -50 && latitude <= -10 && longitude >= 110 && longitude <= 180) {
    return "Oceania"
  }
  if (latitude >= -40 && latitude <= 40 && longitude >= -20 && longitude <= 55) {
    return "Africa"
  }
  return "Global"
}

// Generate custom hub data from user-provided coordinates
export function generateCustomHubData(
  name: string,
  latitude: number,
  longitude: number,
  type: HubType = "port"
): SupplyChainHub {
  const region = getRegionFromCoordinates(latitude, longitude)
  
  const definition: HubDefinition = {
    id: `custom-${Date.now()}`,
    name,
    location: { latitude, longitude },
    country: "Custom Location",
    region,
    type,
  }

  return generateHubData(definition)
}

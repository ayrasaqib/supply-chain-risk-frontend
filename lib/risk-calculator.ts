import type { RiskLevel, RiskFactors, WeatherRisk, LogisticsRisk, GeopoliticalRisk, DailyRisk } from "./types"

// Risk weights for composite calculation
const WEIGHTS = {
  weather: 0.4,
  logistics: 0.35,
  geopolitical: 0.25,
}

export function calculateCompositeRisk(factors: RiskFactors): number {
  const compositeScore =
    WEIGHTS.weather * factors.weather.score +
    WEIGHTS.logistics * factors.logistics.score +
    WEIGHTS.geopolitical * factors.geopolitical.score

  return Math.round(compositeScore)
}

export function getRiskLevel(score: number): RiskLevel {
  if (score <= 25) return "low"
  if (score <= 50) return "elevated"
  if (score <= 75) return "high"
  return "critical"
}

export function getRiskLevelLabel(level: RiskLevel): string {
  const labels: Record<RiskLevel, string> = {
    low: "Low",
    elevated: "Elevated",
    high: "High",
    critical: "Critical",
  }
  return labels[level]
}

// Generate simulated weather risk based on region and season
export function generateWeatherRisk(region: string): WeatherRisk {
  const regionProfiles: Record<string, { baseRisk: number; stormFactor: number; floodFactor: number }> = {
    "East Asia": { baseRisk: 45, stormFactor: 0.7, floodFactor: 0.6 },
    "Southeast Asia": { baseRisk: 55, stormFactor: 0.8, floodFactor: 0.75 },
    "Europe": { baseRisk: 25, stormFactor: 0.3, floodFactor: 0.4 },
    "North America": { baseRisk: 35, stormFactor: 0.5, floodFactor: 0.45 },
    "Middle East": { baseRisk: 20, stormFactor: 0.15, floodFactor: 0.1 },
    "South Asia": { baseRisk: 50, stormFactor: 0.65, floodFactor: 0.7 },
    "South America": { baseRisk: 40, stormFactor: 0.4, floodFactor: 0.5 },
    "Oceania": { baseRisk: 30, stormFactor: 0.35, floodFactor: 0.3 },
    "Africa": { baseRisk: 35, stormFactor: 0.4, floodFactor: 0.45 },
  }

  const profile = regionProfiles[region] || { baseRisk: 35, stormFactor: 0.5, floodFactor: 0.5 }
  const variance = (Math.random() - 0.5) * 30

  const stormProbability = Math.min(100, Math.max(0, profile.stormFactor * 100 + variance))
  const floodRisk = Math.min(100, Math.max(0, profile.floodFactor * 100 + variance * 0.8))
  const temperatureAnomaly = (Math.random() - 0.5) * 10

  const score = Math.min(100, Math.max(0, profile.baseRisk + variance))

  const forecasts = [
    "Clear conditions expected for the next 48 hours",
    "Moderate rain expected, minimal disruption anticipated",
    "Tropical storm developing, monitor closely",
    "Severe weather warning issued for coastal areas",
    "Heavy rainfall may cause localized flooding",
    "High winds expected, potential port delays",
  ]

  const forecastIndex = Math.floor((score / 100) * (forecasts.length - 1))

  return {
    score: Math.round(score),
    stormProbability: Math.round(stormProbability),
    floodRisk: Math.round(floodRisk),
    temperatureAnomaly: Math.round(temperatureAnomaly * 10) / 10,
    forecast: forecasts[forecastIndex],
  }
}

// Generate simulated logistics risk
export function generateLogisticsRisk(hubType: string): LogisticsRisk {
  const baseRisk = hubType === "port" ? 40 : hubType === "airport" ? 35 : 30
  const variance = (Math.random() - 0.5) * 40

  const portCongestion = Math.min(100, Math.max(0, 50 + (Math.random() - 0.5) * 60))
  const shippingDelays = Math.min(100, Math.max(0, 45 + (Math.random() - 0.5) * 50))
  const capacityUtilization = Math.min(100, Math.max(40, 75 + (Math.random() - 0.5) * 30))
  const vesselTraffic = Math.min(100, Math.max(20, 60 + (Math.random() - 0.5) * 40))

  const score = Math.min(100, Math.max(0, baseRisk + variance))

  return {
    score: Math.round(score),
    portCongestion: Math.round(portCongestion),
    shippingDelays: Math.round(shippingDelays),
    capacityUtilization: Math.round(capacityUtilization),
    vesselTraffic: Math.round(vesselTraffic),
  }
}

// Generate simulated geopolitical risk based on region
export function generateGeopoliticalRisk(region: string): GeopoliticalRisk {
  const regionProfiles: Record<string, { baseRisk: number; tradeFactor: number; stabilityFactor: number }> = {
    "East Asia": { baseRisk: 45, tradeFactor: 0.5, stabilityFactor: 0.7 },
    "Southeast Asia": { baseRisk: 35, tradeFactor: 0.4, stabilityFactor: 0.75 },
    "Europe": { baseRisk: 30, tradeFactor: 0.35, stabilityFactor: 0.85 },
    "North America": { baseRisk: 25, tradeFactor: 0.3, stabilityFactor: 0.9 },
    "Middle East": { baseRisk: 50, tradeFactor: 0.55, stabilityFactor: 0.6 },
    "South Asia": { baseRisk: 40, tradeFactor: 0.45, stabilityFactor: 0.65 },
    "South America": { baseRisk: 35, tradeFactor: 0.4, stabilityFactor: 0.7 },
    "Oceania": { baseRisk: 20, tradeFactor: 0.25, stabilityFactor: 0.9 },
    "Africa": { baseRisk: 45, tradeFactor: 0.5, stabilityFactor: 0.6 },
  }

  const profile = regionProfiles[region] || { baseRisk: 35, tradeFactor: 0.4, stabilityFactor: 0.7 }
  const variance = (Math.random() - 0.5) * 25

  const tradeRestrictions = Math.min(100, Math.max(0, profile.tradeFactor * 100 + variance))
  const regionalStability = Math.min(100, Math.max(0, profile.stabilityFactor * 100))
  const regulatoryChanges = Math.min(100, Math.max(0, 30 + (Math.random() - 0.5) * 40))

  const score = Math.min(100, Math.max(0, profile.baseRisk + variance))

  return {
    score: Math.round(score),
    tradeRestrictions: Math.round(tradeRestrictions),
    regionalStability: Math.round(regionalStability),
    regulatoryChanges: Math.round(regulatoryChanges),
  }
}

// Determine primary risk driver
function getPrimaryDriver(weather: WeatherRisk, geopolitical: GeopoliticalRisk): string {
  const weatherFactors = [
    { name: "Storm Activity", value: weather.stormProbability },
    { name: "Flood Conditions", value: weather.floodRisk },
    { name: "Temperature Extremes", value: Math.abs(weather.temperatureAnomaly) * 10 },
  ]
  const geoFactors = [
    { name: "Trade Restrictions", value: geopolitical.tradeRestrictions },
    { name: "Regional Instability", value: 100 - geopolitical.regionalStability },
    { name: "Regulatory Changes", value: geopolitical.regulatoryChanges },
  ]
  
  const allFactors = [...weatherFactors, ...geoFactors]
  const primary = allFactors.reduce((max, f) => (f.value > max.value ? f : max), allFactors[0])
  return primary.name
}

// Generate 7-day forecast with daily risk predictions
export function generateWeeklyForecast(region: string): DailyRisk[] {
  const forecast: DailyRisk[] = []
  const today = new Date()
  
  // Base values for the week with some trend
  const baseTrend = (Math.random() - 0.5) * 0.3 // -15% to +15% trend over the week
  
  for (let day = 0; day < 7; day++) {
    const date = new Date(today)
    date.setDate(date.getDate() + day)
    
    // Add day-specific variance and trend
    const dayVariance = (Math.random() - 0.5) * 20
    const trendFactor = 1 + (baseTrend * (day / 6))
    
    const weather = generateWeatherRisk(region)
    const geopolitical = generateGeopoliticalRisk(region)
    
    // Apply trend and variance
    weather.score = Math.min(100, Math.max(0, Math.round(weather.score * trendFactor + dayVariance)))
    geopolitical.score = Math.min(100, Math.max(0, Math.round(geopolitical.score * trendFactor + dayVariance * 0.5)))
    
    // Calculate composite (simplified - just weather and geopolitical)
    const riskScore = Math.round(weather.score * 0.6 + geopolitical.score * 0.4)
    const riskLevel = getRiskLevel(riskScore)
    const primaryDriver = getPrimaryDriver(weather, geopolitical)
    
    forecast.push({
      date,
      riskScore,
      riskLevel,
      weather,
      geopolitical,
      primaryDriver,
    })
  }
  
  return forecast
}

// Generate alerts based on risk factors
export function generateAlerts(factors: RiskFactors): string[] {
  const alerts: string[] = []

  if (factors.weather.stormProbability > 60) {
    alerts.push("Storm warning: High probability of severe weather")
  }
  if (factors.weather.floodRisk > 70) {
    alerts.push("Flood alert: Elevated flood risk in the area")
  }
  if (factors.logistics.portCongestion > 75) {
    alerts.push("Congestion alert: Port experiencing significant delays")
  }
  if (factors.logistics.shippingDelays > 60) {
    alerts.push("Shipping delays: Average delays exceeding normal levels")
  }
  if (factors.geopolitical.tradeRestrictions > 50) {
    alerts.push("Trade advisory: New restrictions may affect shipments")
  }
  if (factors.geopolitical.regionalStability < 50) {
    alerts.push("Stability concern: Monitor regional developments")
  }

  return alerts
}

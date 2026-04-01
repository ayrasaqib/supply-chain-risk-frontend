export type RiskLevel = "low" | "elevated" | "high" | "critical"

export type HubType = "port" | "airport" | "distribution-center"

export interface WeatherRisk {
  score: number
  stormProbability: number
  floodRisk: number
  temperatureAnomaly: number
  forecast: string
}

export interface LogisticsRisk {
  score: number
  portCongestion: number
  shippingDelays: number
  capacityUtilization: number
  vesselTraffic: number
}

export interface GeopoliticalRisk {
  score: number
  tradeRestrictions: number
  regionalStability: number
  regulatoryChanges: number
}

export interface RiskFactors {
  weather: WeatherRisk
  logistics: LogisticsRisk
  geopolitical: GeopoliticalRisk
}

export interface DailyRisk {
  date: Date
  riskScore: number
  riskLevel: RiskLevel
  weather: WeatherRisk
  geopolitical: GeopoliticalRisk
  primaryDriver: string
}

export interface SupplyChainHub {
  id: string
  name: string
  location: { latitude: number; longitude: number }
  country: string
  region: string
  type: HubType
  riskScore: number
  riskLevel: RiskLevel
  riskFactors: RiskFactors
  weeklyForecast: DailyRisk[]
  lastUpdated: Date
  alerts: string[]
}

export interface RiskSummary {
  totalHubs: number
  lowRisk: number
  elevatedRisk: number
  highRisk: number
  criticalRisk: number
  averageRisk: number
  lastUpdated: Date
}

export const RISK_COLORS = {
  low: "#10b981",
  elevated: "#f59e0b", 
  high: "#f97316",
  critical: "#ef4444",
} as const

export const RISK_THRESHOLDS = {
  low: 25,
  elevated: 50,
  high: 75,
  critical: 100,
} as const

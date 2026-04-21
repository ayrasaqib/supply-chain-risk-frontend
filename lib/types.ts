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
  weather?: WeatherRisk
  geopolitical?: GeopoliticalRisk
  primaryDriver: string
}

export interface ApiRiskOverview {
  dataSource: string
  datasetType: string
  modelVersion?: string
  forecastOrigin?: Date
  peakDay?: Date
  peakDayNumber?: number
  daysAssessed?: number
  currentDate?: Date
  worstInterval?: Date
  snapshotCount: number
}

export interface ApiWeatherRiskFactor {
  score: number
  primaryDriver?: string | null
  primaryDriverLabel?: string | null
}

export interface ApiGeopoliticalSentiment {
  positive?: number | null
  neutral?: number | null
  negative?: number | null
}

export interface ApiGeopoliticalRiskFactor {
  score: number
  articleCount?: number | null
  sentiment?: ApiGeopoliticalSentiment
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
  apiRisk?: ApiRiskOverview
  apiRiskFactors?: {
    weather: ApiWeatherRiskFactor
    geopolitical: ApiGeopoliticalRiskFactor
  }
  latestAssessmentDate?: Date
  latestPrimaryDriver?: string | null
  latestWorstInterval?: Date
  daysAssessed?: number
  peakDay?: Date
  peakDayNumber?: number
  riskDataAvailable?: boolean
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

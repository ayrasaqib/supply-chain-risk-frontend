export interface RiskTimeObject {
  timestamp?: string
  timezone?: string
  duration?: number
  duration_unit?: string
}

export interface RiskSentimentDistribution {
  positive?: number
  neutral?: number
  negative?: number
}

export interface RiskComponentDetails {
  risk_score?: number
  score?: number
  risk?: number
  risk_level?: string
  primary_driver?: string
  article_count?: number
  articles_count?: number
  positive_count?: number
  neutral_count?: number
  negative_count?: number
  positive_articles?: number
  neutral_articles?: number
  negative_articles?: number
  sentiment_distribution?: RiskSentimentDistribution
}

export interface RiskCountryScoreTimeframe {
  risk_score?: number
  avg_sentiment?: number
  article_count?: number
  confidence?: number
  effective_weight?: number
  distribution?: RiskSentimentDistribution
}

export interface RiskCountryScore {
  country?: string
  composite_risk_score?: number
  avg_sentiment?: number
  article_count?: number
  data_available?: boolean
  timeframes?: {
    "7d"?: RiskCountryScoreTimeframe
  }
  sentiment_distribution?: RiskSentimentDistribution
}

export interface RiskSnapshot {
  forecast_timestamp?: string
  forecast_lead_hours?: number
  risk_score?: number
  risk_level?: string
  primary_driver?: string
  weather_risk_score?: number
  weather_score?: number
  weather_risk?: number
  geopolitical_risk_score?: number
  geopolitical_score?: number
  geopolitical_risk?: number
  geo_risk_score?: number
  combined_risk_score?: number
  combined_score?: number
  combined_risk?: number
}

export interface RiskEventAttribute {
  hub_id?: string
  hub_name?: string
  lat?: number
  lon?: number
  day?: number
  date?: string
  peak_risk_score?: number
  mean_risk_score?: number
  risk_level?: string
  combined_risk_score?: number
  combined_risk_level?: string
  primary_driver?: string
  worst_interval?: string
  weather_risk_score?: number
  weather_score?: number
  weather_risk?: number
  weather_component?: number | RiskComponentDetails
  geopolitical_component?: number | RiskComponentDetails
  weather_weight?: number
  geo_weight?: number
  country?: string
  geopolitical_risk_score?: number
  geopolitical_score?: number
  geopolitical_risk?: number
  geo_risk_score?: number
  geopolitical_risk_level?: string
  data_available?: boolean
  country_scores?: RiskCountryScore[]
  combined_component?:
    | number
    | {
        risk_score?: number
        score?: number
        risk?: number
        risk_level?: string
      }
  snapshots?: RiskSnapshot[]
  model_version?: string
  outlook_risk_score?: number
  outlook_risk_level?: string
  outlook_weather_risk_score?: number
  outlook_geopolitical_risk_score?: number
  weather_outlook_risk_score?: number
  geopolitical_outlook_risk_score?: number
  peak_day?: string
  peak_day_number?: number
  forecast_origin?: string
  days_assessed?: number
}

export interface RiskEvent {
  time_object?: RiskTimeObject
  event_type?: string
  attribute?: RiskEventAttribute
}

export interface RiskLocationResponse {
  data_source?: string
  dataset_type?: string
  dataset_id?: string
  time_object?: RiskTimeObject
  events?: RiskEvent[]
}

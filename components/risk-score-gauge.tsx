"use client"

import { RISK_COLORS } from "@/lib/types"
import { getRiskLevel, getRiskLevelLabel } from "@/lib/risk-calculator"

interface RiskScoreGaugeProps {
  score: number
  size?: "sm" | "md" | "lg"
}

export function RiskScoreGauge({ score, size = "md" }: RiskScoreGaugeProps) {
  const level = getRiskLevel(score)
  const color = RISK_COLORS[level]
  const label = getRiskLevelLabel(level)

  const sizeConfig = {
    sm: { width: 80, strokeWidth: 6, fontSize: 16, labelSize: 8 },
    md: { width: 120, strokeWidth: 8, fontSize: 28, labelSize: 10 },
    lg: { width: 160, strokeWidth: 10, fontSize: 36, labelSize: 12 },
  }

  const config = sizeConfig[size]
  const radius = (config.width - config.strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const offset = circumference - progress

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: config.width, height: config.width }}>
        {/* Background circle */}
        <svg
          className="absolute inset-0 -rotate-90 transform"
          width={config.width}
          height={config.width}
        >
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={config.strokeWidth}
            className="text-muted/30"
          />
          {/* Progress arc */}
          <circle
            cx={config.width / 2}
            cy={config.width / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={config.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${color}40)`,
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-bold leading-none text-foreground"
            style={{ fontSize: config.fontSize }}
          >
            {score}
          </span>
        </div>
      </div>

      {/* Label */}
      <span
        className="mt-2 font-medium uppercase tracking-wide"
        style={{ fontSize: config.labelSize, color }}
      >
        {label}
      </span>
    </div>
  )
}

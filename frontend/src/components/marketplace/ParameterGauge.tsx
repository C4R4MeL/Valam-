'use client'

import React from 'react'

interface ParameterGaugeProps {
  label: string
  value: number
  max: number
  minStandard?: number
  unit: string
  isReversed?: boolean // If true, lower is better (like Moisture)
}

export function ParameterGauge({ 
  label, 
  value, 
  max, 
  minStandard = 0, 
  unit, 
  isReversed = false 
}: ParameterGaugeProps) {
  
  const percentage = Math.min(Math.max(value / max, 0), 1)
  const isPassing = isReversed ? value <= minStandard : value >= minStandard
  
  // SVG Arc calculations
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - percentage * circumference
  
  const strokeColor = isPassing ? '#10b981' : '#f59e0b' // emerald-500 or amber-500

  return (
    <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-zinc-100 shadow-sm">
      <div className="relative w-24 h-24 flex items-center justify-center">
        {/* Background Circle */}
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke="#f4f4f5"
            strokeWidth="8"
            fill="transparent"
          />
          {/* Progress Circle */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            stroke={strokeColor}
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-zinc-900 leading-none">{value}</span>
          <span className="text-xs text-zinc-500">{unit}</span>
        </div>
      </div>
      <div className="mt-3 text-center">
        <h4 className="text-sm font-semibold text-zinc-800">{label}</h4>
        <p className="text-xs text-zinc-500 mt-0.5">
          Standar: {isReversed ? 'Maks' : 'Min'} {minStandard}{unit}
        </p>
      </div>
    </div>
  )
}

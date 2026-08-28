'use client'

import * as React from "react"

interface SliderProps {
  value: number[]
  min?: number
  max?: number
  step?: number
  onValueChange: (value: number[]) => void
  className?: string
}

export function Slider({
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  className = ""
}: SliderProps) {
  const currentValue = value[0] ?? min

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange([parseFloat(e.target.value)])
  }

  // Calculate percentage for gradient background
  const percentage = ((currentValue - min) / (max - min)) * 100

  return (
    <div className={`relative flex items-center w-full select-none touch-none ${className}`}>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={currentValue}
        onChange={handleChange}
        style={{
          background: `linear-gradient(to right, #059669 0%, #059669 ${percentage}%, #e4e4e7 ${percentage}%, #e4e4e7 100%)`
        }}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
      />
    </div>
  )
}

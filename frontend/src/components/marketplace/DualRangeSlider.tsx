'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'

interface DualRangeSliderProps {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  formatLabel?: (value: number) => string
}

export function DualRangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatLabel = (v) => v.toString()
}: DualRangeSliderProps) {
  const [localValue, setLocalValue] = useState<[number, number]>(value)
  const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  // Sync with external value changes when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value)
    }
  }, [value, isDragging])

  const getPercent = useCallback(
    (val: number) => Math.round(((val - min) / (max - min)) * 100),
    [min, max]
  )

  const handlePointerDown = (index: 'min' | 'max') => (e: React.PointerEvent) => {
    e.preventDefault()
    setIsDragging(index)
    // Optional: capture pointer to keep tracking if mouse goes outside
    if (e.target instanceof Element) {
      e.target.setPointerCapture(e.pointerId)
    }
  }

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging || !trackRef.current) return

      const rect = trackRef.current.getBoundingClientRect()
      // Calculate percentage based on mouse position relative to track
      let percent = (e.clientX - rect.left) / rect.width
      percent = Math.max(0, Math.min(1, percent)) // Clamp between 0 and 1

      // Convert percentage to actual value based on min/max/step
      const rawValue = percent * (max - min) + min
      let newValue = Math.round(rawValue / step) * step
      newValue = Math.max(min, Math.min(max, newValue)) // Clamp strictly to min/max

      setLocalValue((prev) => {
        const [prevMin, prevMax] = prev
        if (isDragging === 'min') {
          // Prevent min thumb from crossing max thumb
          const nextMin = Math.min(newValue, prevMax)
          if (nextMin !== prevMin) {
            const newRange: [number, number] = [nextMin, prevMax]
            onChange(newRange)
            return newRange
          }
        } else {
          // Prevent max thumb from crossing min thumb
          const nextMax = Math.max(newValue, prevMin)
          if (nextMax !== prevMax) {
            const newRange: [number, number] = [prevMin, nextMax]
            onChange(newRange)
            return newRange
          }
        }
        return prev
      })
    },
    [isDragging, min, max, step, onChange]
  )

  const handlePointerUp = useCallback(() => {
    setIsDragging(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
      window.addEventListener('pointercancel', handlePointerUp)
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [isDragging, handlePointerMove, handlePointerUp])

  const minPercent = getPercent(localValue[0])
  const maxPercent = getPercent(localValue[1])

  return (
    <div className="w-full pt-4 pb-2 select-none touch-none">
      <div 
        ref={trackRef}
        className="dual-range-track"
      >
        {/* Active Track Highlight */}
        <div 
          className="dual-range-track-active"
          style={{ 
            left: `${minPercent}%`, 
            width: `${maxPercent - minPercent}%` 
          }} 
        />
        
        {/* Min Thumb */}
        <div 
          className="dual-range-thumb"
          style={{ left: `${minPercent}%` }}
          onPointerDown={handlePointerDown('min')}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={localValue[1]}
          aria-valuenow={localValue[0]}
          tabIndex={0}
        >
          {/* Tooltip for Min */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1A4D2E] text-white text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-700 whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            {formatLabel(localValue[0])}
          </div>
        </div>

        {/* Max Thumb */}
        <div 
          className="dual-range-thumb"
          style={{ left: `${maxPercent}%` }}
          onPointerDown={handlePointerDown('max')}
          role="slider"
          aria-valuemin={localValue[0]}
          aria-valuemax={max}
          aria-valuenow={localValue[1]}
          tabIndex={0}
        >
          {/* Tooltip for Max */}
          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-[#1A4D2E] text-white text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-700 whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
            {formatLabel(localValue[1])}
          </div>
        </div>
      </div>
      
      {/* Min/Max Labels below slider */}
      <div className="flex justify-between mt-3 text-[10px] font-bold text-zinc-500">
        <span>{formatLabel(localValue[0])}</span>
        <span>{formatLabel(localValue[1])}</span>
      </div>
    </div>
  )
}

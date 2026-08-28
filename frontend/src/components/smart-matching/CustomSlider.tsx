'use client';

import * as React from 'react';

interface CustomSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  formatValue?: (val: number) => string;
  unit?: string;
}

export function CustomSlider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  formatValue,
  unit = '',
}: CustomSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(parseFloat(e.target.value));
  };

  const displayVal = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className="relative pt-6 pb-2 select-none touch-none w-full">
      {/* Floating Tooltip above the thumb */}
      <div
        className="absolute top-0 -translate-x-1/2 bg-emerald-500 text-white text-[10px] font-bold py-0.5 px-2 rounded shadow-md pointer-events-none transition-all duration-75 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-emerald-500"
        style={{ left: `${percentage}%` }}
      >
        {displayVal}
      </div>

      {/* Track and Input Slider */}
      <div className="relative flex items-center w-full">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          style={{
            background: `linear-gradient(to right, #10b981 0%, #f59e0b ${percentage}%, #374151 ${percentage}%, #374151 100%)`,
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-emerald-950
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-emerald-500 [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.5)] [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-110 [&::-webkit-slider-thumb]:active:shadow-[0_0_15px_rgba(245,158,11,0.8)]
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border [&::-moz-range-thumb]:border-emerald-500 [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(16,185,129,0.5)] [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:active:scale-110 [&::-moz-range-thumb]:active:shadow-[0_0_15px_rgba(245,158,11,0.8)]"
        />
      </div>
    </div>
  );
}

export default CustomSlider;

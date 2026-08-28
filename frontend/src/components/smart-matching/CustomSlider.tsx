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
  const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onValueChange(parseFloat(e.target.value));
  };

  const displayVal = formatValue ? formatValue(value) : `${value}${unit}`;

  return (
    <div className="relative pt-6 pb-2 select-none touch-none w-full">
      {/* Floating Tooltip above the thumb */}
      <div
        className="absolute top-0 -translate-x-1/2 bg-[#1A4D2E] text-white text-[10px] font-bold py-0.5 px-2 rounded-md shadow-sm pointer-events-none transition-all duration-75 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-4 after:border-transparent after:border-t-[#1A4D2E]"
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
            background: `linear-gradient(to right, #1A4D2E 0%, #10b981 ${percentage}%, #e4e4e7 ${percentage}%, #e4e4e7 100%)`,
          }}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer focus:outline-none
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#1A4D2E] [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb]:hover:scale-125 [&::-webkit-slider-thumb]:active:scale-110
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-[#1A4D2E] [&::-moz-range-thumb]:shadow-md [&::-moz-range-thumb]:transition-all [&::-moz-range-thumb]:duration-150 [&::-moz-range-thumb]:hover:scale-125 [&::-moz-range-thumb]:active:scale-110"
        />
      </div>
    </div>
  );
}

export default CustomSlider;

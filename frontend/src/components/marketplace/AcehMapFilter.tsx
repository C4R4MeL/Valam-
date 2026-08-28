'use client'

import React, { useState } from 'react'
import { MapPin } from 'lucide-react'
import { useLocale } from 'next-intl'

interface AcehMapFilterProps {
  selectedRegions: string[]
  onToggleRegion: (region: string) => void
  productCounts: Record<string, number>
}

// Terroir regions mapped in our system
const DISTRICTS = [
  { id: 'Aceh Jaya', name: 'Aceh Jaya', path: 'M50,110 L110,80 L130,110 L90,150 Z', x: 90, y: 115 },
  { id: 'Aceh Barat', name: 'Aceh Barat', path: 'M90,150 L130,110 L170,140 L130,185 Z', x: 130, y: 150 },
  { id: 'Nagan Raya', name: 'Nagan Raya', path: 'M130,185 L170,140 L210,165 L180,210 Z', x: 175, y: 180 },
  { id: 'Aceh Selatan', name: 'Aceh Selatan', path: 'M180,210 L210,165 L270,185 L230,240 Z', x: 220, y: 215 },
  { id: 'Aceh Tengah', name: 'Aceh Tengah', path: 'M170,140 L230,105 L260,145 L210,165 Z', x: 215, y: 135 },
  { id: 'Bener Meriah', name: 'Bener Meriah', path: 'M230,105 L280,85 L300,120 L260,145 Z', x: 270, y: 110 },
  { id: 'Gayo Lues', name: 'Gayo Lues', path: 'M260,145 L300,120 L340,160 L270,185 Z', x: 295, y: 155 },
]

export function AcehMapFilter({ selectedRegions, onToggleRegion, productCounts }: AcehMapFilterProps) {
  const locale = useLocale()
  const isId = locale === 'id'
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-400 uppercase tracking-wider">
        <span>{isId ? "PETA INTERAKTIF TERROIR ACEH" : "ACEH TERROIR INTERACTIVE MAP"}</span>
        <span className="text-[10px] text-emerald-600 font-bold normal-case flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {isId ? "Klik daerah" : "Click district"}
        </span>
      </div>

      <div className="relative bg-forest-950 rounded-2xl p-4 border border-forest-900 shadow-inner overflow-hidden">
        {/* Decorative Grid Mesh */}
        <div className="absolute inset-0 bg-[radial-gradient(#15803d_0.8px,transparent_0.8px)] [background-size:12px_12px] opacity-10 pointer-events-none" />

        {/* SVG Interactive Map */}
        <svg 
          viewBox="0 0 380 260" 
          className="w-full h-auto max-h-[220px] filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
        >
          {/* Legend and background text */}
          <text x="15" y="25" fill="#15803d" className="font-mono text-[9px] font-bold tracking-widest uppercase opacity-40">
            TERROIR REGIONS (NAD)
          </text>

          {/* District Path elements */}
          {DISTRICTS.map((d) => {
            const count = productCounts[d.id] || 0
            const hasProducts = count > 0
            const isSelected = selectedRegions.includes(d.id)
            
            // Color mapping based on selection and product availability
            let fillColor = 'fill-zinc-900/40'
            let strokeColor = 'stroke-zinc-800'
            
            if (isSelected) {
              fillColor = 'fill-[#1A4D2E]'
              strokeColor = 'stroke-valam-gold-500'
            } else if (hasProducts) {
              fillColor = hoveredDistrict === d.id ? 'fill-[#1A4D2E]/40' : 'fill-[#1A4D2E]/10'
              strokeColor = hoveredDistrict === d.id ? 'stroke-valam-gold-500' : 'stroke-[#1A4D2E]/40'
            } else {
              fillColor = hoveredDistrict === d.id ? 'fill-zinc-900/70' : 'fill-zinc-900/30'
              strokeColor = 'stroke-zinc-850'
            }

            return (
              <g 
                key={d.id}
                onClick={() => onToggleRegion(d.id)}
                onMouseEnter={() => setHoveredDistrict(d.id)}
                onMouseLeave={() => setHoveredDistrict(null)}
                className={`transition-all duration-300 ${hasProducts ? 'cursor-pointer' : 'cursor-not-allowed'}`}
              >
                <path
                  d={d.path}
                  className={`transition-all duration-300 ${fillColor} ${strokeColor}`}
                  strokeWidth={isSelected ? '2' : '1'}
                  strokeLinejoin="round"
                />
                
                {/* Visual indicator (dot) if region has products */}
                {hasProducts && (
                  <circle
                    cx={d.x}
                    cy={d.y - 8}
                    r="3"
                    className={`animate-pulse ${isSelected ? 'fill-emerald-300' : 'fill-emerald-400'}`}
                  />
                )}

                {/* Text Label */}
                <text
                  x={d.x}
                  y={d.y + 6}
                  textAnchor="middle"
                  className={`font-sans text-[8px] font-bold tracking-tight select-none pointer-events-none transition-colors ${
                    isSelected ? 'fill-white' : hasProducts ? 'fill-warm-200' : 'fill-warm-700'
                  }`}
                >
                  {d.name.replace('Aceh ', '')}
                </text>
              </g>
            )
          })}
        </svg>

        {/* Dynamic Tooltip inside the panel */}
        <div className="mt-3 bg-forest-900 rounded-xl p-2.5 border border-forest-800 text-left min-h-[44px] flex items-center justify-between">
          {hoveredDistrict ? (
            <>
              <div>
                <span className="text-[10px] text-warm-400 font-mono block">Terroir</span>
                <span className="font-bold text-xs text-white">{hoveredDistrict}</span>
              </div>
              <div className="bg-forest-950 border border-forest-800 px-2 py-1 rounded-lg text-right">
                <span className="font-bold text-xs text-gold-500">
                  {productCounts[hoveredDistrict] || 0}
                </span>
                <span className="text-[9px] text-forest-500 block leading-none">{isId ? "Tersedia" : "Available"}</span>
              </div>
            </>
          ) : (
            <span className="text-[10px] text-warm-400 italic block py-1">
              {isId ? "Arahkan kursor ke wilayah peta..." : "Hover over a district region..."}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

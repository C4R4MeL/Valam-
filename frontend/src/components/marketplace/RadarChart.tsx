'use client'

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts'

interface RadarChartProps {
  data: {
    subject: string
    A: number // Actual Value
    B: number // Standard Min/Max
    fullMark: number
  }[]
  variant?: 'light' | 'dark'
}

export function RadarChart({ data, variant = 'light' }: RadarChartProps) {
  const isDark = variant === 'dark'
  
  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
          <PolarGrid stroke={isDark ? '#27272a' : '#e4e4e7'} />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: isDark ? '#a1a1aa' : '#3f3f46', fontSize: 12, fontWeight: 500 }} 
          />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
          
          <Radar
            name="Standar"
            dataKey="B"
            stroke={isDark ? '#059669' : '#10b981'}
            strokeWidth={1}
            fill={isDark ? '#059669' : '#10b981'}
            fillOpacity={isDark ? 0.2 : 0.1}
          />
          <Radar
            name="Hasil Lab"
            dataKey="A"
            stroke={isDark ? '#10b981' : '#064e3b'}
            strokeWidth={2}
            fill={isDark ? '#10b981' : '#064e3b'}
            fillOpacity={isDark ? 0.3 : 0.5}
          />
          <Tooltip 
            contentStyle={{ 
              borderRadius: '8px', 
              border: isDark ? '1px solid #27272a' : 'none', 
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              backgroundColor: isDark ? '#18181b' : '#ffffff',
              color: isDark ? '#e4e4e7' : '#18181b'
            }}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
}

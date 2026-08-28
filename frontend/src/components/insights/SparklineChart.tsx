'use client';

interface SparklineChartProps {
  data: number[];
  color?: string;
}

export function SparklineChart({ data, color = '#10B981' }: SparklineChartProps) {
  // Fallback to synthetic trends if data is empty or too short
  const points = data.length >= 2 ? data : [100, 102, 101, 104, 103, 106, 108];
  
  const width = 60;
  const height = 24;
  const padding = 2;

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min === 0 ? 1 : max - min;

  const pointsString = points
    .map((val, index) => {
      const x = padding + (index / (points.length - 1)) * (width - padding * 2);
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  const pathD = `M ${pointsString.split(' ').map((p, i) => (i === 0 ? p : `L ${p}`)).join(' ')}`;

  return (
    <svg width={width} height={height} className="overflow-visible">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

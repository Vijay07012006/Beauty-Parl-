'use client';

import { motion } from 'framer-motion';

interface SvgChartProps {
  type: 'bar' | 'line' | 'pie';
  title: string;
  labels: string[];
  values: number[];
}

export function SvgChart({ type, title, labels, values }: SvgChartProps) {
  const maxVal = Math.max(...values, 1);
  const chartHeight = 160;
  const chartWidth = 320;
  const padding = 30;

  // Render Bar Chart
  if (type === 'bar') {
    const barWidth = (chartWidth - padding * 2) / values.length - 8;
    return (
      <div className="bg-card/75 backdrop-blur-md p-4 rounded-2xl border border-border/60 shadow-sm w-full space-y-3">
        <h4 className="text-xs font-bold text-foreground font-playfair">{title}</h4>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          {/* Grid lines */}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = padding + (i * (chartHeight - padding * 2)) / 3;
            const gridVal = maxVal - (i * maxVal) / 3;
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  className="stroke-border/40"
                  strokeWidth={1}
                />
                <text
                  x={padding - 5}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground text-[8px] font-mono"
                >
                  {Math.round(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {values.map((val, idx) => {
            const x = padding + idx * ((chartWidth - padding * 2) / values.length) + 4;
            const barHeight = ((chartHeight - padding * 2) * val) / maxVal;
            const y = chartHeight - padding - barHeight;

            return (
              <g key={idx}>
                <motion.rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  className="fill-primary/80 hover:fill-primary transition-colors cursor-pointer"
                  rx={3}
                  initial={{ height: 0, y: chartHeight - padding }}
                  animate={{ height: barHeight, y }}
                  transition={{ duration: 0.5, delay: idx * 0.05 }}
                />
                <text
                  x={x + barWidth / 2}
                  y={chartHeight - padding + 12}
                  textAnchor="middle"
                  className="fill-muted-foreground text-[8px] truncate max-w-[40px]"
                >
                  {labels[idx]}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={y - 4}
                  textAnchor="middle"
                  className="fill-foreground text-[8px] font-bold"
                >
                  {val}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  }

  // Render Line Chart
  if (type === 'line') {
    const points = values.map((val, idx) => {
      const x = padding + (idx * (chartWidth - padding * 2)) / (values.length - 1 || 1);
      const y = chartHeight - padding - ((chartHeight - padding * 2) * val) / maxVal;
      return { x, y, val, label: labels[idx] };
    });

    const pathD = points.reduce((acc, p, idx) => {
      return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
    }, '');

    return (
      <div className="bg-card/75 backdrop-blur-md p-4 rounded-2xl border border-border/60 shadow-sm w-full space-y-3">
        <h4 className="text-xs font-bold text-foreground font-playfair">{title}</h4>
        <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-auto overflow-visible">
          {/* Grid lines */}
          {Array.from({ length: 4 }).map((_, i) => {
            const y = padding + (i * (chartHeight - padding * 2)) / 3;
            const gridVal = maxVal - (i * maxVal) / 3;
            return (
              <g key={i}>
                <line
                  x1={padding}
                  y1={y}
                  x2={chartWidth - padding}
                  y2={y}
                  className="stroke-border/40"
                  strokeWidth={1}
                />
                <text
                  x={padding - 5}
                  y={y + 3}
                  textAnchor="end"
                  className="fill-muted-foreground text-[8px] font-mono"
                >
                  {Math.round(gridVal)}
                </text>
              </g>
            );
          })}

          {/* Sparkline Path */}
          {points.length > 0 && (
            <motion.path
              d={pathD}
              fill="none"
              className="stroke-primary"
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8 }}
            />
          )}

          {/* Dots */}
          {points.map((p, idx) => (
            <g key={idx}>
              <motion.circle
                cx={p.x}
                cy={p.y}
                r={4}
                className="fill-primary stroke-background cursor-pointer"
                strokeWidth={1.5}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
              />
              <text
                x={p.x}
                y={chartHeight - padding + 12}
                textAnchor="middle"
                className="fill-muted-foreground text-[8px]"
              >
                {p.label}
              </text>
              <text
                x={p.x}
                y={p.y - 6}
                textAnchor="middle"
                className="fill-foreground text-[8px] font-bold"
              >
                {p.val}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  // Render Pie Chart (SVG Donut)
  if (type === 'pie') {
    const total = values.reduce((sum, v) => sum + v, 0);
    let cumulativeAngle = 0;
    const r = 50;
    const cx = 100;
    const cy = 80;

    return (
      <div className="bg-card/75 backdrop-blur-md p-4 rounded-2xl border border-border/60 shadow-sm w-full space-y-3">
        <h4 className="text-xs font-bold text-foreground font-playfair">{title}</h4>
        <div className="flex items-center gap-6">
          <svg viewBox="0 0 200 160" className="w-1/2 h-auto">
            {values.map((val, idx) => {
              const percentage = val / (total || 1);
              const angle = percentage * 360;
              const x1 = cx + r * Math.cos((cumulativeAngle - 90) * (Math.PI / 180));
              const y1 = cy + r * Math.sin((cumulativeAngle - 90) * (Math.PI / 180));
              cumulativeAngle += angle;
              const x2 = cx + r * Math.cos((cumulativeAngle - 90) * (Math.PI / 180));
              const y2 = cy + r * Math.sin((cumulativeAngle - 90) * (Math.PI / 180));
              const largeArcFlag = angle > 180 ? 1 : 0;

              // Color tints
              const colors = ['#E0115F', '#4E0E2E', '#D2B48C', '#FF7F50', '#FF69B4'];
              const color = colors[idx % colors.length];

              const pathD = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

              return (
                <motion.path
                  key={idx}
                  d={pathD}
                  fill={color}
                  className="stroke-card hover:opacity-90 cursor-pointer"
                  strokeWidth={1}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                />
              );
            })}
            {/* Center cutout for donut look */}
            <circle cx={cx} cy={cy} r={r * 0.5} className="fill-card" />
          </svg>

          {/* Legend */}
          <div className="w-1/2 space-y-1.5 text-[10px]">
            {values.map((val, idx) => {
              const colors = ['#E0115F', '#4E0E2E', '#D2B48C', '#FF7F50', '#FF69B4'];
              const color = colors[idx % colors.length];
              return (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="font-semibold truncate flex-1">{labels[idx]}</span>
                  <span className="text-muted-foreground font-mono font-bold">{val}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

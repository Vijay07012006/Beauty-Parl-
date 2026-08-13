'use client';

import { Bar, Line } from 'react-chartjs-2';
import { useTheme } from 'next-themes';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SalesChartProps {
  data: {
    title?: string;
    labels: string[];
    values: number[];
  };
  type?: 'bar' | 'line';
}

export function SalesChart({ data, type = 'bar' }: SalesChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? '#f8fafc' : '#0f172a';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(15, 23, 42, 0.06)';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: textColor,
          font: { family: 'inherit', size: 11 }
        }
      },
      title: {
        display: true,
        text: data.title || 'Sales Overview',
        color: textColor,
        font: { family: 'inherit', size: 13, weight: 'bold' }
      },
      tooltip: {
        padding: 10,
        backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        titleFont: { family: 'inherit', size: 12 },
        bodyFont: { family: 'inherit', size: 11 }
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: isDark ? '#94a3b8' : '#64748b', font: { size: 10 } }
      }
    }
  };

  const chartData = {
    labels: data.labels || [],
    datasets: [
      {
        label: 'Sales (₹)',
        data: data.values || [],
        backgroundColor: 'rgba(219, 39, 119, 0.45)', // primary (pink) transparent tint
        borderColor: 'hsl(var(--primary))',
        borderWidth: 2,
        fill: type === 'line',
        tension: 0.35,
      },
    ],
  };

  return (
    <div className="w-full h-[220px]">
      {type === 'bar' ? (
        <Bar options={options as any} data={chartData} />
      ) : (
        <Line options={options as any} data={chartData} />
      )}
    </div>
  );
}

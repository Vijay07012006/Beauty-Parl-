'use client';

import { Doughnut, Pie } from 'react-chartjs-2';
import { useTheme } from 'next-themes';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

interface CategoryChartProps {
  data: {
    title?: string;
    labels: string[];
    values: number[];
  };
  type?: 'pie' | 'doughnut';
}

export function CategoryChart({ data, type = 'pie' }: CategoryChartProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const textColor = isDark ? '#f8fafc' : '#0f172a';

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'right' as const,
        labels: {
          color: textColor,
          boxWidth: 12,
          font: { family: 'inherit', size: 10 }
        }
      },
      title: {
        display: true,
        text: data.title || 'Category Performance',
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
    }
  };

  const chartData = {
    labels: data.labels || [],
    datasets: [
      {
        data: data.values || [],
        backgroundColor: [
          'rgba(219, 39, 119, 0.7)',  // primary Pink
          'rgba(147, 51, 234, 0.7)',  // purple-600
          'rgba(59, 130, 246, 0.7)',  // blue-500
          'rgba(16, 185, 129, 0.7)',  // emerald-500
          'rgba(245, 158, 11, 0.7)',  // amber-500
          'rgba(239, 68, 68, 0.7)',   // red-500
        ],
        borderColor: [
          isDark ? '#1e293b' : '#ffffff',
        ],
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="w-full h-[220px] flex items-center justify-center">
      {type === 'doughnut' ? (
        <Doughnut options={options as any} data={chartData} />
      ) : (
        <Pie options={options as any} data={chartData} />
      )}
    </div>
  );
}

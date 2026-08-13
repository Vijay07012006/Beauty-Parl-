'use client';

import { Bar, Line } from 'react-chartjs-2';
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
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: 'hsl(var(--foreground))',
          font: { family: 'inherit', size: 11 }
        }
      },
      title: {
        display: true,
        text: data.title || 'Sales Overview',
        color: 'hsl(var(--foreground))',
        font: { family: 'inherit', size: 13, weight: 'bold' }
      },
      tooltip: {
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: { family: 'inherit', size: 12 },
        bodyFont: { family: 'inherit', size: 11 }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: 'hsl(var(--muted-foreground))', font: { size: 10 } }
      },
      y: {
        grid: { color: 'rgba(0, 0, 0, 0.05)' },
        ticks: { color: 'hsl(var(--muted-foreground))', font: { size: 10 } }
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

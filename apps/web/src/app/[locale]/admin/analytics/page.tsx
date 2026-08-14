'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { api } from '@/lib/api';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Users, 
  Percent, 
  Layers, 
  Award,
  Calendar
} from 'lucide-react';
import { useParams } from 'next/navigation';

interface RevenueTrend {
  date: string;
  revenue: number;
  orders: number;
}

interface Cohort {
  cohort: string;
  size: number;
  m1: number;
  m2: number | null;
  m3: number | null;
  m4: number | null;
}

interface FunnelStage {
  stage: string;
  count: number;
  pct: number;
}

interface TopProduct {
  id: number;
  name: string;
  revenue: number;
  sales: number;
}

interface AnalyticsData {
  revenueTrends: RevenueTrend[];
  cohorts: Cohort[];
  conversionFunnels: FunnelStage[];
  topProducts: TopProduct[];
}

export default function AdminAnalyticsPage() {
  const params = useParams();
  const locale = params?.locale || 'en';
  
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d'); // 7d, 30d, 90d

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/admin/analytics/data');
        setData(response.data);
      } catch (error) {
        console.error('Failed to fetch analytics data', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [timeRange]);

  // Calculate totals
  const totalRevenue = data?.revenueTrends.reduce((acc, curr) => acc + curr.revenue, 0) || 0;
  const totalOrders = data?.revenueTrends.reduce((acc, curr) => acc + curr.orders, 0) || 0;
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Simple SVG Line Chart Generator
  const renderTrendChart = (trends: RevenueTrend[]) => {
    if (!trends || trends.length === 0) return null;
    const maxVal = Math.max(...trends.map(t => t.revenue), 100);
    const height = 150;
    const width = 500;
    const padding = 10;
    
    const points = trends.map((t, idx) => {
      const x = padding + (idx / (trends.length - 1)) * (width - padding * 2);
      const y = height - padding - (t.revenue / maxVal) * (height - padding * 2);
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-[220px]">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(232, 160, 191)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="rgb(232, 160, 191)" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Grid lines */}
        <line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="5,5" />
        
        {/* Area fill */}
        <path
          d={`M ${padding},${height - padding} L ${points} L ${width - padding},${height - padding} Z`}
          fill="url(#chartGradient)"
        />
        
        {/* Trendline */}
        <polyline
          fill="none"
          stroke="rgb(232, 160, 191)"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />

        {/* Date labels at boundaries */}
        <text x={padding} y={height - 2} fill="rgba(255,255,255,0.4)" fontSize="8">{trends[0].date}</text>
        <text x={width / 2} y={height - 2} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="middle">{trends[Math.floor(trends.length / 2)].date}</text>
        <text x={width - padding} y={height - 2} fill="rgba(255,255,255,0.4)" fontSize="8" textAnchor="end">{trends[trends.length - 1].date}</text>
      </svg>
    );
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-playfair font-bold bg-gradient-to-r from-pink-400 to-rose-300 bg-clip-text text-transparent">Enterprise Analytics</h1>
              <p className="text-sm text-muted-foreground">Monitor sales, conversion, and retention trends.</p>
            </div>
            
            {/* Range Selector */}
            <div className="flex bg-secondary/40 rounded-xl p-1 border border-border/40">
              {['7d', '30d', '90d'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    timeRange === range 
                      ? 'bg-gradient-to-r from-pink-500 to-rose-400 text-white shadow-md' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-32">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-400"></div>
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Revenue ({timeRange})</p>
                    <p className="text-3xl font-bold mt-1">${totalRevenue.toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign size={24} />
                  </div>
                </div>

                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Delivered Orders</p>
                    <p className="text-3xl font-bold mt-1">{totalOrders}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-400">
                    <ShoppingBag size={24} />
                  </div>
                </div>

                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg. Order Value</p>
                    <p className="text-3xl font-bold mt-1">${avgOrderValue.toFixed(2)}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-500/10 text-purple-400">
                    <TrendingUp size={24} />
                  </div>
                </div>
              </div>

              {/* Main Chart Section */}
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <TrendingUp className="text-pink-400" size={20} />
                  Revenue Trendline
                </h3>
                {data && renderTrendChart(data.revenueTrends)}
              </div>

              {/* Grid Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Conversion Funnel */}
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Layers className="text-pink-400" size={20} />
                    Conversion Funnel
                  </h3>
                  <div className="space-y-4">
                    {data?.conversionFunnels.map((stage) => (
                      <div key={stage.stage} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{stage.stage}</span>
                          <span className="text-muted-foreground">
                            {stage.count} ({stage.pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-secondary/50 rounded-full h-3 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full transition-all duration-1000"
                            style={{ width: `${stage.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Products */}
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Award className="text-pink-400" size={20} />
                    Top Products by Revenue
                  </h3>
                  <div className="divide-y divide-border/40">
                    {data?.topProducts.map((product) => (
                      <div key={product.id} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                        <div className="truncate max-w-[280px]">
                          <p className="font-semibold text-sm truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sales} orders</p>
                        </div>
                        <p className="font-bold text-pink-400">${product.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Retention Cohorts */}
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="text-pink-400" size={20} />
                  User Cohort Retention
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border/50 text-muted-foreground text-xs font-semibold">
                        <th className="pb-3">Cohort Month</th>
                        <th className="pb-3">Size</th>
                        <th className="pb-3 text-center">Month 1</th>
                        <th className="pb-3 text-center">Month 2</th>
                        <th className="pb-3 text-center">Month 3</th>
                        <th className="pb-3 text-center">Month 4</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {data?.cohorts.map((cohort) => (
                        <tr key={cohort.cohort} className="hover:bg-secondary/10 transition-colors">
                          <td className="py-3 font-semibold">{cohort.cohort}</td>
                          <td className="py-3 text-muted-foreground">{cohort.size} users</td>
                          <td className="py-3 text-center bg-pink-500/10 text-pink-400 font-bold rounded-lg m-1">{cohort.m1}%</td>
                          <td className="py-3 text-center">
                            {cohort.m2 !== null ? (
                              <span className="bg-pink-500/8 text-pink-300 px-3 py-1 rounded-lg font-semibold">{cohort.m2}%</span>
                            ) : '-'}
                          </td>
                          <td className="py-3 text-center">
                            {cohort.m3 !== null ? (
                              <span className="bg-pink-500/6 text-pink-200 px-3 py-1 rounded-lg font-semibold">{cohort.m3}%</span>
                            ) : '-'}
                          </td>
                          <td className="py-3 text-center">
                            {cohort.m4 !== null ? (
                              <span className="bg-pink-500/4 text-pink-100 px-3 py-1 rounded-lg font-semibold">{cohort.m4}%</span>
                            ) : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}

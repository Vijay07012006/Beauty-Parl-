'use client';

import { Sparkles, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

interface InsightData {
  message: string;
  trend: 'up' | 'down' | 'neutral';
  value: string;
  recommendation?: string;
}

interface InsightCardProps {
  insight: InsightData;
}

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <div className="w-full flex flex-col gap-4">
      <div className="shrink-0 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Business Insight</p>
      </div>

      <div className="p-5 bg-gradient-to-br from-primary/10 to-purple-600/5 rounded-3xl border border-primary/20 shadow-sm relative overflow-hidden flex flex-col gap-3">
        {/* Glow tint background decorator */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full filter blur-2xl -mr-6 -mt-6 pointer-events-none" />

        <div className="flex items-start justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-primary/80 bg-primary/10 px-2 py-0.5 rounded-full">
              Trend Signal
            </span>
            <p className="text-xs font-medium text-foreground leading-relaxed mt-2.5">
              {insight.message}
            </p>
          </div>

          <div className="shrink-0">
            {insight.trend === 'up' && (
              <div className="flex items-center gap-1 bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-emerald-500/10">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>{insight.value}</span>
              </div>
            )}
            {insight.trend === 'down' && (
              <div className="flex items-center gap-1 bg-red-500/10 text-red-500 px-2.5 py-1 rounded-xl text-[10px] font-bold border border-red-500/10">
                <TrendingDown className="w-3.5 h-3.5" />
                <span>{insight.value}</span>
              </div>
            )}
            {insight.trend === 'neutral' && (
              <div className="flex items-center gap-1 bg-secondary text-muted-foreground px-2.5 py-1 rounded-xl text-[10px] font-bold">
                <span>{insight.value}</span>
              </div>
            )}
          </div>
        </div>

        {insight.recommendation && (
          <div className="mt-2 pt-3 border-t border-border/50 relative z-10 flex gap-2">
            <div className="w-5 h-5 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3 h-3" />
            </div>
            <div className="space-y-0.5">
              <p className="text-[10px] font-bold text-foreground">Recommended Action</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{insight.recommendation}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

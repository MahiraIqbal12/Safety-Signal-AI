import AppLayout from "@/components/AppLayout";
import { useState, useEffect } from "react";
import { useSupabaseAuth } from "@/hooks/useAuth";
import { getIssueTypeDistribution, getAuthenticityTrends, getTopFlaggedProducts } from "@/data/mockData";
import type { IssueTypeData } from "@/services/reportService";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, Cell,
} from "recharts";

const ReportsPage = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [issueTypeDistribution, setIssueTypeDistribution] = useState<IssueTypeData[]>([]);
  const [authenticityTrends, setAuthenticityTrends] = useState<{ month: string; genuine: number; suspicious: number }[]>([]);
  const [topFlaggedProducts, setTopFlaggedProducts] = useState<{ product: string; flags: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const [distributionData, trendsData, flaggedProductsData] = await Promise.all([
          getIssueTypeDistribution(user.id),
          getAuthenticityTrends(user.id),
          getTopFlaggedProducts(user.id)
        ]);
        
        setIssueTypeDistribution(distributionData);
        setAuthenticityTrends(trendsData);
        setTopFlaggedProducts(flaggedProductsData);
      } catch (error) {
        console.error("Error fetching report data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (authLoading || loading) {
    return (
      <AppLayout title="Reports">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading report data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="Reports">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-muted-foreground mb-4">Please log in</h2>
            <p className="text-sm text-muted-foreground">You need to be logged in to view reports</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Reports">
      <div className="space-y-6">
        <h3 className="text-lg font-bold text-foreground">Monthly Safety Risk Summary</h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Issue Types Distribution */}
          <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Issue Types Distribution</h4>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={issueTypeDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                  {issueTypeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            {/* Color Legend */}
            <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border">
              {issueTypeDistribution.length > 0 && issueTypeDistribution[0].type !== "No data yet" ? (
                issueTypeDistribution.map((entry, index) => (
                  <div key={entry.type} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="font-medium">{entry.type}</span>
                    <span className="text-muted-foreground">({entry.count})</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-muted-foreground">No data to display</div>
              )}
            </div>
          </div>

          {/* Authenticity Trends */}
          <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
            <h4 className="text-sm font-medium text-muted-foreground mb-4">Authenticity Trends</h4>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={authenticityTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Area type="monotone" dataKey="genuine" stackId="1" fill="hsl(var(--chart-5))" stroke="hsl(var(--chart-5))" fillOpacity={0.3} />
                <Area type="monotone" dataKey="suspicious" stackId="1" fill="hsl(var(--chart-4))" stroke="hsl(var(--chart-4))" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Flagged Products */}
        <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Top Flagged Products</h4>
          <div className="space-y-3">
            {topFlaggedProducts.length > 0 && topFlaggedProducts[0].product !== "No flagged products yet" ? (
              topFlaggedProducts.map((p, i) => (
                <div key={p.product} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-card-foreground">{p.product}</span>
                      <span className="text-xs text-muted-foreground">{p.flags} flags</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full bg-destructive transition-all"
                        style={{ width: `${(p.flags / topFlaggedProducts[0].flags) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No flagged products yet. Start manual auditing to identify flagged products.
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default ReportsPage;

import AppLayout from "@/components/AppLayout";
import { ShieldAlert, Search, CheckCircle, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import { getRiskTrendData, getIssueCategoryData, getDashboardMetrics } from "@/data/mockData";
import type { TrendData, CategoryData } from "@/services/dashboardService";
import { useSupabaseAuth } from "@/hooks/useAuth";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell,
} from "recharts";

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub?: string; color: string }) => (
  <div className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow animate-fade-in">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-3xl font-bold text-card-foreground">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const SafetyGauge = ({ score }: { score: number }) => {
  const color = score >= 80 ? "text-destructive" : score >= 60 ? "text-warning" : "text-success";
  const bgColor = score >= 80 ? "bg-destructive/10" : score >= 60 ? "bg-warning/10" : "bg-success/10";
  const label = score >= 80 ? "High Risk" : score >= 60 ? "Attention Needed" : "Safe";
  const circumference = 2 * Math.PI * 70;
  const dashOffset = circumference - (score / 100) * circumference * 0.75;

  return (
    <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center hover:shadow-md transition-shadow animate-fade-in">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">Safety Health Score</h3>
      <div className="relative w-48 h-36">
        <svg viewBox="0 0 160 100" className="w-full h-full">
          <path d="M 10 90 A 70 70 0 0 1 150 90" fill="none" stroke="hsl(var(--border))" strokeWidth="12" strokeLinecap="round" />
          <path
            d="M 10 90 A 70 70 0 0 1 150 90"
            fill="none"
            className={`stroke-current ${color}`}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference * 0.75}
            strokeDashoffset={dashOffset}
            style={{ transition: "stroke-dashoffset 1s ease-in-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className={`text-4xl font-bold ${color}`}>{score}%</span>
        </div>
      </div>
      <span className={`mt-2 text-sm font-medium px-3 py-1 rounded-full ${bgColor} ${color}`}>{label}</span>
    </div>
  );
};

const barColors = [ "hsl(var(--chart-2))", "hsl(var(--chart-1))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

const DashboardPage = () => {
  const { user, loading: authLoading } = useSupabaseAuth();
  const [metrics, setMetrics] = useState({
    totalReviews: 0,
    criticalHazards: 0,
    authenticityScore: 0
  });
  const [riskTrendData, setRiskTrendData] = useState<TrendData[]>([]);
  const [issueCategoryData, setIssueCategoryData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return;
      
      try {
        setLoading(true);
        const [metricsData, trendData, categoryData] = await Promise.all([
          getDashboardMetrics(user.id),
          getRiskTrendData(user.id),
          getIssueCategoryData(user.id)
        ]);
        
        setMetrics(metricsData);
        setRiskTrendData(trendData);
        setIssueCategoryData(categoryData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.id]);

  if (authLoading || loading) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-muted-foreground mb-4">Please log in</h2>
            <p className="text-sm text-muted-foreground">You need to be logged in to view your dashboard</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Dashboard">
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            icon={Search} 
            label="Total Reviews Scanned" 
            value={metrics.totalReviews.toLocaleString()} 
            sub={`${metrics.totalReviews > 1000 ? '+' : ''}${Math.floor(metrics.totalReviews * 0.07)} this week`} 
            color="bg-primary/10 text-primary" 
          />
          <StatCard 
            icon={ShieldAlert} 
            label="Critical Hazards Detected" 
            value={metrics.criticalHazards.toString()} 
            sub={`${metrics.criticalHazards > 0 ? metrics.criticalHazards : 'No'} new today`} 
            color="bg-destructive/10 text-destructive" 
          />
          <StatCard 
            icon={CheckCircle} 
            label="Authenticity Score" 
            value={`${metrics.authenticityScore}%`} 
            sub="Genuine Reviews" 
            color="bg-blue-500/10 text-blue-600" 
          />
        </div>

        {/* Gauge + Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <SafetyGauge score={metrics.authenticityScore} />
          <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-muted-foreground">Hazard Reports Over Time</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Last 30 days</span>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={riskTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
                <Line type="monotone" dataKey="hazards" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ fill: "hsl(var(--destructive))", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Issue Categories */}
        <div className="rounded-xl border border-border bg-card p-6 hover:shadow-md transition-shadow animate-fade-in">
          <h3 className="text-sm font-medium text-muted-foreground mb-4">Top Detected Issue Categories</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={issueCategoryData} layout="vertical" margin={{ left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={110} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                {issueCategoryData.map((_, i) => (
                  <Cell key={i} fill={barColors[i % barColors.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;

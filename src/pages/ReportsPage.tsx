import AppLayout from "@/components/AppLayout";
import { monthlyIssueData, authenticityTrendData, topFlaggedProducts } from "@/data/mockData";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";

const ReportsPage = () => (
  <AppLayout title="Reports">
    <div className="space-y-6">
      <h3 className="text-lg font-bold text-foreground">Monthly Safety Risk Summary</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Issue Types Distribution */}
        <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Issue Types Distribution</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyIssueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Legend />
              <Bar dataKey="critical" fill="hsl(var(--chart-2))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="high" fill="hsl(var(--chart-3))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="medium" fill="hsl(var(--chart-1))" radius={[2, 2, 0, 0]} />
              <Bar dataKey="low" fill="hsl(var(--chart-5))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Authenticity Trend */}
        <div className="rounded-xl border border-border bg-card p-6 animate-fade-in">
          <h4 className="text-sm font-medium text-muted-foreground mb-4">Authenticity Trend</h4>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={authenticityTrendData}>
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
          {topFlaggedProducts.map((p, i) => (
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
          ))}
        </div>
      </div>
    </div>
  </AppLayout>
);

export default ReportsPage;

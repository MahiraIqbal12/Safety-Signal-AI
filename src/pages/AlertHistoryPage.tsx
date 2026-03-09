import AppLayout from "@/components/AppLayout";
import { mockAlerts } from "@/data/mockData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const riskColor: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-destructive/80 text-destructive-foreground",
  Medium: "bg-warning text-warning-foreground",
  Low: "bg-muted text-muted-foreground",
};

const statusColor: Record<string, string> = {
  "Alert Sent": "bg-success/10 text-success",
  Reviewed: "bg-primary/10 text-primary",
  Pending: "bg-warning/10 text-warning",
};

const AlertHistoryPage = () => (
  <AppLayout title="Alert History">
    <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-card-foreground text-sm">Previous Alerts</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              <th className="text-left p-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Issue Type</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Risk Level</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Alert Status</th>
              <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {mockAlerts.map((a) => (
              <tr key={a.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                <td className="p-3 text-card-foreground">{a.date}</td>
                <td className="p-3 text-card-foreground font-medium">{a.product}</td>
                <td className="p-3 text-card-foreground">{a.issueType}</td>
                <td className="p-3"><Badge className={riskColor[a.riskLevel]}>{a.riskLevel}</Badge></td>
                <td className="p-3"><Badge variant="outline" className={statusColor[a.status]}>{a.status}</Badge></td>
                <td className="p-3"><Button size="sm" variant="ghost"><Eye className="w-4 h-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </AppLayout>
);

export default AlertHistoryPage;

import { Review } from "@/types/review";

export const mockReviews: Review[] = [];

export const mockAlerts: {
  id: string;
  date: string;
  product: string;
  issueType: string;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  status: "Alert Sent" | "Reviewed" | "Pending";
}[] = [];

export const riskTrendData: { date: string; hazards: number }[] = [];

export const issueCategoryData: { category: string; count: number }[] = [];

export const monthlyIssueData: { month: string; critical: number; high: number; medium: number; low: number }[] = [];

export const authenticityTrendData: { month: string; genuine: number; suspicious: number }[] = [];

export const topFlaggedProducts: { product: string; flags: number }[] = [];

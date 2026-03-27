import { Review } from "@/types/review";
import { fetchDashboardMetrics, fetchRiskTrendData, fetchIssueCategoryData } from "@/services/dashboardService";
import { fetchReports, fetchReportStats, fetchReportTrends, fetchIssueTypeDistribution, fetchAuthenticityTrends, fetchTopFlaggedProducts } from "@/services/reportService";

// Mock data arrays (kept for backward compatibility, but now populated dynamically)
export const mockReviews: Review[] = [];
export const mockAlerts: {
  id: string;
  date: string;
  product: string;
  issueType: string;
  riskLevel: "Critical" | "High" | "Medium" | "Low";
  status: "Alert Sent" | "Reviewed" | "Pending";
}[] = [];

export const monthlyIssueData: { month: string; critical: number; high: number; medium: number; low: number }[] = [];
export const authenticityTrendData: { month: string; genuine: number; suspicious: number }[] = [];
export const topFlaggedProducts: { product: string; flags: number }[] = [];

// Dynamic data functions that fetch from Supabase
export async function getRiskTrendData(userId: string) {
  try {
    return await fetchRiskTrendData(userId);
  } catch (error) {
    console.error("Error fetching risk trend data:", error);
    return [{ date: "No data yet", hazards: 0 }];
  }
}

export async function getIssueCategoryData(userId: string) {
  try {
    return await fetchIssueCategoryData(userId);
  } catch (error) {
    console.error("Error fetching issue category data:", error);
    return [{ category: "No categories yet", count: 0 }];
  }
}

export async function getDashboardMetrics(userId: string) {
  try {
    return await fetchDashboardMetrics(userId);
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    return {
      totalReviews: 0,
      criticalHazards: 0,
      authenticityScore: 0
    };
  }
}

// Report data functions for ReportsPage
export async function getReports(userId: string) {
  try {
    return await fetchReports(userId);
  } catch (error) {
    console.error("Error fetching reports:", error);
    return [];
  }
}

export async function getReportStats(userId: string) {
  try {
    return await fetchReportStats(userId);
  } catch (error) {
    console.error("Error fetching report stats:", error);
    return {
      totalReports: 0,
      criticalReports: 0,
      resolvedReports: 0
    };
  }
}

export async function getReportTrends(userId: string) {
  try {
    return await fetchReportTrends(userId);
  } catch (error) {
    console.error("Error fetching report trends:", error);
    return [{ month: "No data yet", reports: 0 }];
  }
}

export async function getIssueTypeDistribution(userId: string) {
  try {
    return await fetchIssueTypeDistribution(userId);
  } catch (error) {
    console.error("Error fetching issue type distribution:", error);
    return [{ type: "No data yet", count: 0, color: "hsl(var(--chart-1))" }];
  }
}

export async function getAuthenticityTrends(userId: string) {
  try {
    return await fetchAuthenticityTrends(userId);
  } catch (error) {
    console.error("Error fetching authenticity trends:", error);
    return [{ month: "No data yet", genuine: 0, suspicious: 0 }];
  }
}

export async function getTopFlaggedProducts(userId: string) {
  try {
    return await fetchTopFlaggedProducts(userId);
  } catch (error) {
    console.error("Error fetching top flagged products:", error);
    return [{ product: "No flagged products yet", flags: 0 }];
  }
}

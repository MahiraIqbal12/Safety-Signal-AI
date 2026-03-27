import { supabase } from "@/integrations/supabase/client";
import type { Review } from "@/types/review";

/**
 * Report interface for ReportsPage
 */
export interface Report {
  id: string;
  title: string;
  date: string;
  status: "Pending Review" | "Resolved";
  downloadUrl: string;
}

/**
 * Report statistics interface
 */
export interface ReportStats {
  totalReports: number;
  criticalReports: number;
  resolvedReports: number;
}

/**
 * Trend data for line chart
 */
export interface TrendData {
  month: string;
  reports: number;
}

/**
 * Issue type distribution data
 */
export interface IssueTypeData {
  type: string;
  count: number;
  color: string;
}

/**
 * Fetch reports from Supabase reviews table for specific user
 */
export async function fetchReports(userId: string): Promise<Report[]> {
  try {
    // Fetch all reviews for the user
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("auth_user_id", userId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Error fetching reports:", error);
      return [];
    }

    const reviewList = (reviews ?? []) as Review[];

    // Convert reviews to reports format
    const reports: Report[] = reviewList.map(review => ({
      id: review.id,
      title: `${review.product_name} - ${review.issue_category}`,
      date: new Date(review.timestamp).toLocaleDateString(),
      status: review.flagged ? "Pending Review" : "Resolved",
      downloadUrl: `/api/reports/${review.id}/download`
    }));

    return reports;
  } catch (error) {
    console.error("Unexpected error in fetchReports:", error);
    return [];
  }
}

/**
 * Fetch report statistics for specific user
 */
export async function fetchReportStats(userId: string): Promise<ReportStats> {
  try {
    // Fetch all reviews for the user
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("auth_user_id", userId);

    if (error) {
      console.error("Error fetching report stats:", error);
      return {
        totalReports: 0,
        criticalReports: 0,
        resolvedReports: 0
      };
    }

    const reviewList = (reviews ?? []) as Review[];

    // Calculate statistics
    const totalReports = reviewList.length;
    const criticalReports = reviewList.filter(review => 
      review.risk_level === "Critical"
    ).length;
    const resolvedReports = reviewList.filter(review => 
      !review.flagged
    ).length;

    return {
      totalReports,
      criticalReports,
      resolvedReports
    };
  } catch (error) {
    console.error("Unexpected error in fetchReportStats:", error);
    return {
      totalReports: 0,
      criticalReports: 0,
      resolvedReports: 0
    };
  }
}

/**
 * Fetch report trends for specific user
 */
export async function fetchReportTrends(userId: string): Promise<TrendData[]> {
  try {
    // Fetch reviews for the user
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("timestamp")
      .eq("auth_user_id", userId);

    if (error) {
      console.error("Error fetching report trends:", error);
      return [];
    }

    const reviewList = (reviews ?? []) as Review[];

    // Group by month and count reports
    const monthMap = new Map<string, number>();
    
    reviewList.forEach(review => {
      if (review.timestamp) {
        // Extract month from timestamp (YYYY-MM format)
        const date = new Date(review.timestamp);
        const month = date.toISOString().slice(0, 7); // YYYY-MM
        monthMap.set(month, (monthMap.get(month) || 0) + 1);
      }
    });

    // Convert to array and sort by month
    const trendData: TrendData[] = Array.from(monthMap.entries())
      .map(([month, reports]) => ({ month, reports }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Add empty state placeholder if no data
    if (trendData.length === 0) {
      return [{ month: "No data yet", reports: 0 }];
    }

    return trendData;
  } catch (error) {
    console.error("Unexpected error in fetchReportTrends:", error);
    return [{ month: "No data yet", reports: 0 }];
  }
}

/**
 * Fetch issue type distribution for specific user
 */
export async function fetchIssueTypeDistribution(userId: string): Promise<IssueTypeData[]> {
  try {
    // Fetch reviews for the user
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("risk_level")
      .eq("auth_user_id", userId);

    if (error) {
      console.error("Error fetching issue type distribution:", error);
      return [];
    }

    const reviewList = (reviews ?? []) as Review[];

    // Group by risk level and count
    const riskMap = new Map<string, number>();
    
    reviewList.forEach(review => {
      if (review.risk_level) {
        riskMap.set(review.risk_level, (riskMap.get(review.risk_level) || 0) + 1);
      }
    });

    // Define colors for each risk level
    const colorMap = {
      "Critical": "hsl(var(--destructive))",
      "High": "hsl(var(--chart-2))",
      "Medium": "hsl(var(--chart-3))",
      "Low": "hsl(var(--chart-4))",
      "Safe": "hsl(var(--chart-5))"
    };

    // Convert to array and sort by count (descending)
    const issueTypeData: IssueTypeData[] = Array.from(riskMap.entries())
      .map(([type, count]) => ({
        type,
        count,
        color: colorMap[type as keyof typeof colorMap] || "hsl(var(--chart-1))"
      }))
      .sort((a, b) => b.count - a.count);

    // Add empty state placeholder if no data
    if (issueTypeData.length === 0) {
      return [{ type: "No data yet", count: 0, color: "hsl(var(--chart-1))" }];
    }

    return issueTypeData;
  } catch (error) {
    console.error("Unexpected error in fetchIssueTypeDistribution:", error);
    return [{ type: "No data yet", count: 0, color: "hsl(var(--chart-1))" }];
  }
}

/**
 * Fetch authenticity trends for specific user
 */
export async function fetchAuthenticityTrends(userId: string): Promise<{ month: string; genuine: number; suspicious: number }[]> {
  try {
    // Fetch reviews for the user
const { data: reviews, error } = await supabase
  .from("reviews")
  .select("created_at, authenticity_score")
  .eq("auth_user_id", userId);

const reviewList = (reviews ?? []) as any[];

const monthMap = new Map<string, { genuine: number; suspicious: number; count: number }>();

reviewList.forEach(review => {
  if (review.created_at && review.authenticity_score !== null && review.authenticity_score !== undefined) {
    const date = new Date(review.created_at);
    const month = date.toISOString().slice(0, 10); // turn to (0,7) for month level

    const isGenuine = review.authenticity_score >= 0.7;
    const score = review.authenticity_score * 100;

    if (!monthMap.has(month)) {
      monthMap.set(month, { genuine: 0, suspicious: 0, count: 0 });
    }

    const monthData = monthMap.get(month)!;

    if (isGenuine) {
      monthData.genuine += score;
    } else {
      monthData.suspicious += (100 - score);
    }

    monthData.count++;
  }
});

    // Convert to array and sort by month, then calculate averages
    const trendData = Array.from(monthMap.entries())
      .map(([month, data]) => ({
        month,
        genuine: Math.round(data.genuine / data.count) || 0,
        suspicious: Math.round(data.suspicious / data.count) || 0
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Add empty state placeholder if no data
    if (trendData.length === 0) {
      return [{ month: "No data yet", genuine: 0, suspicious: 0 }];
    }

    return trendData;
  } catch (error) {
    console.error("Unexpected error in fetchAuthenticityTrends:", error);
    return [{ month: "No data yet", genuine: 0, suspicious: 0 }];
  }
}

/**
 * Fetch top flagged products for specific user
 */
export async function fetchTopFlaggedProducts(userId: string): Promise<{ product: string; flags: number }[]> {
  try {
    // Fetch reviews for the user
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("product_name, risk_level")
      .eq("auth_user_id", userId);

    if (error) {
      console.error("Error fetching top flagged products:", error);
      return [];
    }

    const reviewList = (reviews ?? []) as Review[];

    // Group by product and count flags
    const productMap = new Map<string, number>();
    
    reviewList.forEach(review => {
      if (
  review.product_name &&
  (review.risk_level === "Critical")
) {
  productMap.set(
    review.product_name,
    (productMap.get(review.product_name) || 0) + 1
  );
}
    });

    // Convert to array and sort by flags (descending)
    const flaggedProducts = Array.from(productMap.entries())
      .map(([product, flags]) => ({ product, flags }))
      .sort((a, b) => b.flags - a.flags);

    // Add empty state placeholder if no data
    if (flaggedProducts.length === 0) {
      return [{ product: "No flagged products yet", flags: 0 }];
    }

    return flaggedProducts;
  } catch (error) {
    console.error("Unexpected error in fetchTopFlaggedProducts:", error);
    return [{ product: "No flagged products yet", flags: 0 }];
  }
}

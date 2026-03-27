import { supabase } from "@/integrations/supabase/client";
import type { Review } from "@/types/review";

/**
 * Dashboard metrics interface
 */
export interface DashboardMetrics {
  totalReviews: number;
  criticalHazards: number;
  authenticityScore: number;
}

/**
 * Trend data for line chart
 */
export interface TrendData {
  date: string;
  hazards: number;
}

/**
 * Category data for bar chart
 */
export interface CategoryData {
  category: string;
  count: number;
}

/**
 * Fetch dashboard metrics from Supabase reviews table for specific user
 */
export async function fetchDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  try {
    // Fetch reviews for specific user
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("auth_user_id", userId);

    if (error) {
      console.error("Error fetching reviews for metrics:", error);
      return {
        totalReviews: 0,
        criticalHazards: 0,
        authenticityScore: 0
      };
    }

    const reviewList = (reviews ?? []) as Review[];

    // Calculate metrics
    const totalReviews = reviewList.length;
    const criticalHazards = reviewList.filter(review => 
      review.risk_level === "Critical"
    ).length;
    
    // Calculate average authenticity score
    const totalAuthenticity = reviewList.reduce((sum, review) => 
      sum + (review.authenticity_score || 0), 0
    );
    const authenticityScore = totalReviews > 0 
      ? Math.round((totalAuthenticity / totalReviews) * 100) 
      : 0;

    return {
      totalReviews,
      criticalHazards,
      authenticityScore
    };
  } catch (error) {
    console.error("Unexpected error in fetchDashboardMetrics:", error);
    return {
      totalReviews: 0,
      criticalHazards: 0,
      authenticityScore: 0
    };
  }
}

/**
 * Fetch trend data for hazard reports over time for specific user
 */

    export async function fetchRiskTrendData(userId: string): Promise<TrendData[]> {
  try {
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("created_at, risk_level")
      .eq("auth_user_id", userId);

    if (error) {
      console.error("Error fetching risk trend data:", error);
      return [];
    }

    console.log("📊 RAW REVIEWS:", reviews);

    const dateMap = new Map<string, number>();

    reviews?.forEach((review: any) => {
      if (review.created_at) {
        // ✅ Correct way to extract date
        const date = review.created_at.split("T")[0];

        // ✅ Case-safe check
        if (review.risk_level?.toLowerCase() === "critical") {
          dateMap.set(date, (dateMap.get(date) || 0) + 1);
        }
      }
    });

    const trendData: TrendData[] = Array.from(dateMap.entries())
      .map(([date, hazards]) => ({ date, hazards }))
      .sort((a, b) => a.date.localeCompare(b.date));

    console.log("📈 TREND DATA:", trendData);

    return trendData.length > 0 ? trendData : [];
  } catch (error) {
    console.error("Unexpected error:", error);
    return [];
  }
}

/**
 * Fetch top issue categories data for specific user
 */
export async function fetchIssueCategoryData(userId: string): Promise<CategoryData[]> {
  try {
    // Fetch reviews with issue categories for specific user
    const { data: reviews, error } = await supabase
      .from("reviews")
      .select("issue_category")
      .eq("auth_user_id", userId);

    if (error) {
      console.error("Error fetching issue category data:", error);
      return [];
    }

    const reviewList = (reviews ?? []) as Review[];

    // Group by category and count
    const categoryMap = new Map<string, number>();
    
    reviewList.forEach(review => {
      if (review.issue_category) {
        categoryMap.set(review.issue_category, (categoryMap.get(review.issue_category) || 0) + 1);
      }
    });

    // Convert to array and sort by count (descending)
    const categoryData: CategoryData[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    // Add empty state placeholder if no data
    if (categoryData.length === 0) {
      return [{ category: "No categories yet", count: 0 }];
    }

    return categoryData;
  } catch (error) {
    console.error("Unexpected error in fetchIssueCategoryData:", error);
    return [{ category: "No categories yet", count: 0 }];
  }
}

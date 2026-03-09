import { supabase } from "@/integrations/supabase/client";
import type { Review } from "@/types/review";

/**
 * Fetch all reviews from Supabase.
 */
export async function fetchReviews(): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("timestamp", { ascending: false });

  if (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }

  return (data ?? []) as Review[];
}

/**
 * Insert parsed CSV reviews into Supabase.
 */
export async function insertReviews(reviews: any[]): Promise<{ success: boolean; error?: string }> {
  const formattedRows = reviews.map(row => {
    // Use exact CSV headers
    const rawDate = row.review_date || row["review_date"];
    const rawUser = row.user_id || row["user_id"];

    // Convert date to YYYY-MM-DD if present
    const parsedDate = rawDate ? new Date(rawDate).toISOString().split("T")[0] : null;

    return {
      product_name: row.product_name || row["product_name"] || "",
      review_text: row.review_text || row["review_text"] || "",
      review_date: parsedDate,
      user_id: rawUser || null,
      risk_level: row.classification || null,
      issue_category: null,
      authenticity_score: null,
      ai_confidence: null,
      ai_processed: true,
      auth_user_id: null
    };
  });

  console.log("Mapped rows for Supabase:", formattedRows);

  try {
    const { data, error } = await supabase
      .from("reviews")
      .insert(formattedRows)
      .select(); // returns inserted rows

    if (error) {
      console.error("Supabase insert error:", error);
      return { success: false, error: error.message };
    }

    console.log("Supabase insert success:", data);
    return { success: true };
  } catch (err) {
    console.error("Supabase insert error:", err);
    return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Fetch alerts from Supabase.
 */
export async function fetchAlerts() {
  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .order("date", { ascending: false });

  if (error) {
    console.error("Error fetching alerts:", error);
    return [];
  }

  return data ?? [];
}
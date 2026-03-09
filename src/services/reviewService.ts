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
export async function insertReviews(reviews: Omit<Review, "id">[]): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase.from("reviews").insert(reviews);

  if (error) {
    console.error("Error inserting reviews:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
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

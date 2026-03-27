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
  try {
    console.log("Starting insertReviews with", reviews.length, "reviews");
    
    // Get current authenticated user
    const { data: authData, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error("Auth error:", authError);
      return { success: false, error: "Authentication failed: " + authError.message };
    }

    if (!authData.user) {
      console.error("No authenticated user found");
      return { success: false, error: "No authenticated user found" };
    }

    const authUserId = authData.user.id;
    console.log("Authenticated user ID:", authUserId);

    const formattedRows = reviews.map((row, index) => {
      console.log(`Processing review ${index}:`, {
        product_name: row.product_name,
        review_text: row.review_text?.substring(0, 50) + "...",
        review_date: row.review_date,
        user_id: row.user_id,
        risk_level: row.risk_level,
        issue_category: row.issue_category,
        authenticity_score: row.authenticity_score,
        ai_confidence: row.ai_confidence
      });

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
        risk_level: row.risk_level || row["risk_level"] || null,
        issue_category: row.issue_category || row["issue_category"] || null,
        authenticity_score: row.authenticity_score || row["authenticity_score"] || null,
        ai_confidence: row.ai_confidence || row["ai_confidence"] || null,
        auth_user_id: authUserId
      };
    });

    console.log("Formatted rows for Supabase:", formattedRows);

    // Test single insert first
    if (formattedRows.length > 0) {
      console.log("Testing single insert...");
      const { data: testResult, error: testError } = await supabase
        .from("reviews")
        .insert([formattedRows[0]])
        .select();

      if (testError) {
        console.error("Single insert test failed:", testError);
        console.error("RLS Policy Issue: You need to update your Supabase RLS policy for the reviews table");
        console.error("Run this SQL in your Supabase SQL Editor:");
        console.error(`
          -- Enable RLS for reviews table
          ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
          
          -- Allow authenticated users to insert reviews
          CREATE POLICY "Allow authenticated insert" ON reviews
          FOR INSERT TO authenticated
          WITH CHECK (true);
          
          -- Allow users to view their own reviews
          CREATE POLICY "Allow own reviews select" ON reviews
          FOR SELECT USING (auth_user_id = auth.uid());
        `);
        return { success: false, error: "RLS Policy Issue: " + testError.message };
      }
      console.log("Single insert test successful:", testResult);
    }

    // Now try bulk insert
    console.log("Attempting bulk insert...");
    const { data, error } = await supabase
      .from("reviews")
      .insert(formattedRows)
      .select(); // returns inserted rows

    if (error) {
      console.error("Supabase insert error:", error);
      console.error("Error details:", {
        code: error.code,
        details: error.details,
        hint: error.hint,
        message: error.message
      });
      return { success: false, error: error.message };
    }

    console.log("Supabase insert success:", data);
    console.log("Inserted", data.length, "records");
    return { success: true };
  } catch (err) {
    console.error("Unexpected error in insertReviews:", err);
    console.error("Error stack:", err instanceof Error ? err.stack : "No stack trace");
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
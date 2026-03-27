export interface Review {
  id: string;
  review_text: string;
  product_name: string;
  review_date?: string;
  user_id?: string;
  risk_level: "Critical" | "High" | "Medium" | "Low" | "Safe";
  issue_category: string;
  authenticity_score: number;
  ai_confidence: number;
  timestamp: string;
  flagged: boolean;
  classification: string;
}
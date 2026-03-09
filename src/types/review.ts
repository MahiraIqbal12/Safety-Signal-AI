export interface Review {
  id: string;
  review_text: string;
  product_name: string;
  risk_level: "Critical" | "High" | "Medium" | "Low" | "Safe";
  issue_category: string;
  authenticity_score: number;
  ai_confidence: number;
  timestamp: string;
  flagged: boolean;
}

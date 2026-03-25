// ManualAuditPage.tsx
import { useState, useCallback, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Review } from "@/types/review";
import { Upload, FileSearch, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { parseCSV } from "@/utils/csvParser";
import { insertReviews } from "@/services/reviewService";

const riskColor: Record<string, string> = {
  Critical: "bg-destructive text-destructive-foreground",
  High: "bg-destructive/80 text-destructive-foreground",
  Medium: "bg-warning text-warning-foreground",
  Low: "bg-muted text-muted-foreground",
  Safe: "bg-success text-success-foreground",
};

const BATCH_SIZE = 20;

const ManualAuditPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processWithAI = useCallback(async (reviews: Review[]): Promise<Review[]> => {
    const results: Review[] = [];

    for (let i = 0; i < reviews.length; i += BATCH_SIZE) {
      const batch = reviews.slice(i, i + BATCH_SIZE);

      try {
        const API_URL = import.meta.env.DEV
          ? "http://localhost:3000/api/ai-classify-review"
          : "/api/ai-classify-review";

        const res = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reviews: batch.map((r) => ({
              review_text: r.review_text,
              product_name: r.product_name,
            })),
          }),
        });

        if (!res.ok) throw new Error(`AI API failed: ${res.status}`);

        const aiResults = await res.json();

        aiResults.forEach((aiResult: any, idx: number) => {
          results.push({
            id: `rev_${Date.now()}_${i + idx}`,
            review_text: batch[idx].review_text,
            product_name: batch[idx].product_name,
            review_date: batch[idx].review_date,
            user_id: batch[idx].user_id,
            risk_level: aiResult.risk_level || "Low",
            issue_category: aiResult.issue_category || "General",
            authenticity_score: aiResult.authenticity_score ?? 0.5,
            ai_confidence: aiResult.ai_confidence ?? 0.5,
            timestamp: new Date().toISOString(),
            flagged: false,
            classification: aiResult.classification || "Low Value Lead",
          });
        });

      } catch (err) {
        console.error("AI batch error:", err);

        // fallback
        batch.forEach((r, idx) => {
          results.push({
            id: `rev_${Date.now()}_${i + idx}`,
            review_text: r.review_text,
            product_name: r.product_name,
            review_date: r.review_date,
            user_id: r.user_id,
            risk_level: "Low",
            issue_category: "General",
            authenticity_score: 0.5,
            ai_confidence: 0.5,
            timestamp: new Date().toISOString(),
            flagged: false,
            classification: "Low Value Lead",
          });
        });
      }
    }

    return results;
  }, []);

  const processFile = useCallback(
    async (file: File) => {
      if (!file.name.endsWith(".csv")) {
        toast({ title: "Invalid file", description: "Please upload a CSV file.", variant: "destructive" });
        return;
      }

      setScanning(true);
      setReviews([]);

      try {
        const result = await parseCSV(file);

        const reviewsWithId = result.reviews.map((review, index) => ({
          ...review,
          id: `parsed_${Date.now()}_${index}`,
        }));

        const aiProcessedData = await processWithAI(reviewsWithId);

        console.log("✅ AI DONE:", aiProcessedData);

        // ✅ FIX 1: Show results immediately (NO BLOCKING)
        setReviews(aiProcessedData);

        // ✅ FIX 2: Save to DB in background
        insertReviews(aiProcessedData)
          .then(() => {
            console.log("✅ Saved to Supabase");
          })
          .catch((err) => {
            console.error("❌ Insert failed:", err);
            toast({
              title: "Database Error",
              description: "Results shown but failed to save.",
              variant: "destructive",
            });
          });

        if (result.errors.length > 0) {
          toast({
            title: "Parsed with warnings",
            description: `${result.errors.length} rows had issues.`,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Scan Complete",
            description: `${aiProcessedData.length} reviews analyzed successfully.`,
          });
        }

      } catch (err) {
        console.error("File processing error:", err);
        toast({
          title: "Parse Error",
          description: "Failed to parse CSV file.",
          variant: "destructive",
        });
      } finally {
        setScanning(false); // ✅ ALWAYS stops loading
      }
    },
    [toast, processWithAI]
  );

  const handleUpload = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const openAnalysis = (review: Review) => {
    setSelectedReview(review);
    setDrawerOpen(true);
  };

  return (
    <AppLayout title="Manual Audit">
      <div className="space-y-6">
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={handleUpload}
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors"
        >
          {scanning ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-sm font-medium">Scanning reviews…</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto mb-3" />
              <p className="font-semibold">Upload Product Reviews CSV</p>
            </>
          )}
        </div>

        {reviews.length > 0 && (
          <div className="rounded-xl border bg-card overflow-hidden">
            <div className="p-4 border-b flex items-center gap-2">
              <FileSearch className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Analysis Results</h3>
              <Badge className="ml-auto">{reviews.length} reviews</Badge>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-secondary/30">
                      <td className="p-3 max-w-xs truncate">{r.review_text}</td>
                      <td className="p-3">
                        <Badge className={riskColor[r.risk_level]}>{r.risk_level}</Badge>
                      </td>
                      <td className="p-3">{r.issue_category}</td>
                      <td className="p-3">{Math.round(r.ai_confidence * 100)}%</td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" onClick={() => openAnalysis(r)}>
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default ManualAuditPage;
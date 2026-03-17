// ManualAuditPage.tsx
import { useState, useCallback, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Review } from "@/types/review";
import { Upload, FileSearch, AlertTriangle, MessageCircle, Mail, Hash } from "lucide-react";
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

const BATCH_SIZE = 20; // Send 20 reviews per AI request

const ManualAuditPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Process reviews in batches
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

        if (!res.ok) throw new Error(`AI API failed with status ${res.status}`);
        const aiResults = await res.json();

        aiResults.forEach((aiResult: any, idx: number) => {
          results.push({
            id: `rev_${Date.now()}_${i + idx}`, // ✅ Add unique ID here
            review_text: batch[idx].review_text,
            product_name: batch[idx].product_name,
            risk_level: aiResult.risk_level || "Low",
            issue_category: aiResult.issue_category || "General Safety",
            authenticity_score: aiResult.authenticity_score ?? 0.5,
            ai_confidence: aiResult.ai_confidence ?? 0.5,
            timestamp: new Date().toISOString(),
            flagged: false,
            classification: aiResult.classification || "Low Value Lead",
          });
          console.log("AI Response:", batch[idx].review_text, aiResult);
        });
      } catch (err) {
        console.error("AI batch processing error:", err);
        // Fallback defaults
        batch.forEach((r, idx) => {
          results.push({
            id: `rev_${Date.now()}_${i + idx}`, // still generate id
            review_text: r.review_text,
            product_name: r.product_name,
            risk_level: "Low",
            issue_category: "General Safety",
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
        // Convert Omit<Review, "id">[] to Review[] by adding id property
        const reviewsWithId = result.reviews.map((review, index) => ({
          ...review,
          id: `parsed_${Date.now()}_${index}`
        }));
        const aiProcessedData = await processWithAI(reviewsWithId);

        console.log("Final AI Processed Data:", aiProcessedData);

        await insertReviews(aiProcessedData);

        setReviews(aiProcessedData);

        if (result.errors.length > 0) {
          toast({ title: "Parsed with warnings", description: `${result.errors.length} rows had issues.`, variant: "destructive" });
        } else {
          toast({ title: "Scan Complete", description: `${aiProcessedData.length} reviews analyzed successfully.` });
        }
      } catch (err) {
        console.error("File processing error:", err);
        toast({ title: "Parse Error", description: "Failed to parse CSV file.", variant: "destructive" });
      } finally {
        setScanning(false);
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
  const sendAlert = (channel: string) => {
    toast({ title: "Emergency Alert Sent", description: `Alert sent to safety team via ${channel}.` });
  };

  return (
    <AppLayout title="Manual Audit">
      <div className="space-y-6">
        <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFileChange} />

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={handleUpload}
          className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-primary/5 transition-colors animate-fade-in"
        >
          {scanning ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-sm font-medium text-foreground">Scanning reviews for safety hazards…</p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-foreground">Upload Product Reviews CSV</p>
              <p className="text-sm text-muted-foreground">or drag and drop file here</p>
              <p className="text-xs text-muted-foreground mt-2">Accepted format: CSV</p>
            </>
          )}
        </div>

        {/* Analysis Table */}
        {reviews.length > 0 && (
          <div className="rounded-xl border border-border bg-card overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-border flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-card-foreground text-sm">Analysis Results</h3>
              <Badge variant="secondary" className="ml-auto">{reviews.length} reviews</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Review Snippet</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Risk Level</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Issue Category</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Authenticity</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">AI Confidence</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className="border-b border-border hover:bg-secondary/30 transition-colors">
                      <td className="p-3 max-w-xs truncate text-card-foreground">{r.review_text}</td>
                      <td className="p-3"><Badge className={riskColor[r.risk_level]}>{r.risk_level}</Badge></td>
                      <td className="p-3 text-card-foreground">{r.issue_category}</td>
                      <td className="p-3 text-card-foreground">{r.authenticity_score >= 0.7 ? "Real" : "Suspicious"} – {Math.round(r.authenticity_score * 100)}%</td>
                      <td className="p-3 text-card-foreground">{Math.round(r.ai_confidence * 100)}%</td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" onClick={() => openAnalysis(r)}>View Analysis</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI Analysis Drawer */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" /> AI Safety Auditor
              </SheetTitle>
            </SheetHeader>
            {selectedReview && (
              <div className="mt-6 space-y-6">
                <Section label="Review" value={`"${selectedReview.review_text}"`} />
                <Section label="Product" value={selectedReview.product_name} />
                <Section label="Detected Risk" value={selectedReview.issue_category}>
                  <Badge className={`mt-1 ${riskColor[selectedReview.risk_level]}`}>{selectedReview.risk_level}</Badge>
                </Section>
                <Section label="Authenticity Assessment" value={`${selectedReview.authenticity_score >= 0.7 ? "Likely Genuine Review" : "Suspicious Review"} — Confidence ${Math.round(selectedReview.authenticity_score * 100)}%`} />
                <Section label="AI Confidence" value={`Gemini Confidence ${Math.round(selectedReview.ai_confidence * 100)}%`} />
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
};

const Section = ({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) => (
  <div>
    <p className="text-xs font-medium text-muted-foreground mb-1">{label}</p>
    <p className="text-sm text-card-foreground font-medium">{value}</p>
    {children}
  </div>
);

export default ManualAuditPage;

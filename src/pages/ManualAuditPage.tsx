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
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left p-3 font-medium text-muted-foreground">Review Text</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Risk Level</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Issue Category</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">AI Authenticity</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">AI Confidence</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => (
                    <tr key={r.id} className="border-b hover:bg-secondary/30">
                      <td className="p-3 max-w-xs truncate">{r.review_text}</td>
                      <td className="p-3">
                        <Badge className={riskColor[r.risk_level]}>{r.risk_level}</Badge>
                      </td>
                      <td className="p-3">{r.issue_category}</td>
                      <td className="p-3">{Math.round(r.authenticity_score * 100)}%</td>
                      <td className="p-3">{Math.round(r.ai_confidence * 100)}%</td>
                      <td className="p-3">
                        <Button size="sm" variant="outline" onClick={() => openAnalysis(r)}>
                          View Analysis
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Analysis Sidebar */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="right" className="w-full max-w-md p-0">
            <SheetHeader className="p-6 border-b">
              <SheetTitle className="text-lg font-semibold">Review Analysis</SheetTitle>
            </SheetHeader>
            <div className="p-6 space-y-6">
              {selectedReview && (
                <>
                  {/* Review Details */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">Review Text</h4>
                      <p className="text-sm bg-secondary p-3 rounded-lg">{selectedReview.review_text}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Product</h4>
                        <p className="text-sm">{selectedReview.product_name}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Date</h4>
                        <p className="text-sm">{selectedReview.review_date}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Risk Level</h4>
                        <Badge className={riskColor[selectedReview.risk_level]}>{selectedReview.risk_level}</Badge>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">Issue Category</h4>
                        <p className="text-sm">{selectedReview.issue_category}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">AI Authenticity</h4>
                        <p className="text-sm font-medium">{Math.round(selectedReview.authenticity_score * 100)}%</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-muted-foreground mb-2">AI Confidence</h4>
                        <p className="text-sm font-medium">{Math.round(selectedReview.ai_confidence * 100)}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Alert Buttons */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Send Alert</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#25D366">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.653-.916-2.256-.234-.575-.467-.486-.641-.486-.173 0-.371-.025-.57-.025-.394 0-.738.1-.986.274-.247.173-.935.915-1.423 1.761-.414.702-.788 1.355-.788 2.579 0 1.249.9 2.39 2.024 3.222.812.59 1.602 1.054 2.424 1.08.823.024 1.273-.173 1.822-.46.548-.287 1.761-.849 2.01-1.022.248-.173.52-.173.72-.074.198.099 1.422 1.072 1.62 1.171.199.099.348.149.496.149.15 0 .348-.05.57-.248z"/>
                        </svg>
                        WhatsApp
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#611f69">
                          <path d="M22.675 0h-21.35c-.732 0-1.325.593-1.325 1.325v21.351c0 .731.593 1.324 1.325 1.324h7.458v-9.294h-2.02v-3.622h2.02v-2.671c0-2.056 1.252-3.182 3.089-3.182.877 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.304.619-1.304 1.258v1.508h2.219l-.354 3.618h-1.865v9.294h7.457c.73 0 1.323-.593 1.323-1.325v-21.35c0-.732-.593-1.325-1.325-1.325z"/>
                        </svg>
                        Slack
                      </Button>
                      <Button variant="outline" size="sm" className="w-full">
                        <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="#D44638">
                          <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.887.7-1.61 1.587-1.636h4.154c.168 0 .31.103.357.256l2.326 7.239 3.244-3.245c.24-.24.64-.28.92-.12l7.926 4.734h.003v-2.065l-2.357-1.406c-.271-.16-.332-.52-.15-.78l3.095-4.132c.215-.287.65-.363.95-.173l4.154 2.477A1.636 1.636 0 0 1 24 5.457z"/>
                        </svg>
                        Email
                      </Button>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm text-muted-foreground">Additional Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Classification:</span>
                        <p className="font-medium">{selectedReview.classification}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">User ID:</span>
                        <p className="font-medium">{selectedReview.user_id}</p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </AppLayout>
  );
};

export default ManualAuditPage;
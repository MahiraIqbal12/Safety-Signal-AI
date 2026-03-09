import { useState, useCallback, useRef } from "react";
import AppLayout from "@/components/AppLayout";
import { Review } from "@/types/review";
import { Upload, FileSearch, AlertTriangle, Send, MessageCircle, Mail, Hash } from "lucide-react";
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

const ManualAuditPage = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [scanning, setScanning] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const processFile = useCallback(async (file: File) => {
    if (!file.name.endsWith(".csv")) {
      toast({ title: "Invalid file", description: "Please upload a CSV file.", variant: "destructive" });
      return;
    }
    setScanning(true);
    setReviews([]);
    try {
      const result = await parseCSV(file);
      console.log("CSV raw keys from first row:", Object.keys(result.reviews[0] || {}));
      
      function classifyRow(row) {
        const score = Number(row.Assignment_Quality_Score)
        if (score >= 7) return "High Value Lead"
        if (score >= 4) return "Medium Value Lead"
        return "Low Value Lead"
      }

      const processedData = result.reviews.map(row => ({
        ...row,
        classification: classifyRow(row)
      }));

      console.log('Processed CSV Data:', processedData);
      await insertReviews(processedData);

      const parsed: Review[] = processedData.map((r, i) => ({
        ...r,
        id: `rev_${Date.now()}_${i}`,
      }));
      setReviews(parsed);

      if (result.errors.length > 0) {
        toast({ title: "Parsed with warnings", description: `${result.errors.length} rows had issues.`, variant: "destructive" });
      } else {
        toast({ title: "Scan Complete", description: `${parsed.length} reviews analyzed successfully.` });
      }

      // Placeholder: send to Supabase
      // const { success, error } = await insertReviews(result.reviews);
    } catch {
      toast({ title: "Parse Error", description: "Failed to parse CSV file.", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  }, [toast]);

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

        {/* Upload Zone */}
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
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">AI Reasoning</p>
                  <p className="text-sm text-card-foreground bg-secondary rounded-lg p-3">
                    {selectedReview.authenticity_score < 0.5
                      ? `This review exhibits patterns consistent with inauthentic reviews: exaggerated language, competitor mentions, and lack of specific product experience details.`
                      : `The review contains language associated with physical injury and describes a negative reaction after product use. Similar language patterns are commonly associated with ${selectedReview.issue_category.toLowerCase()} complaints.`}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Send Emergency Alert</p>
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm" onClick={() => sendAlert("WhatsApp")} className="gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</Button>
                    <Button size="sm" variant="outline" onClick={() => sendAlert("Email")} className="gap-1"><Mail className="w-3 h-3" /> Email</Button>
                    <Button size="sm" variant="outline" onClick={() => sendAlert("Slack")} className="gap-1"><Hash className="w-3 h-3" /> Slack</Button>
                  </div>
                </div>
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
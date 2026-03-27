import { Link } from "react-router-dom";
import { Shield, FileSearch, AlertTriangle, ShieldCheck, Upload, Brain, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import LandingNavbar from "@/components/LandingNavbar";

const features = [
  {
    icon: FileSearch,
    title: "Audit Reviews",
    description: "Upload CSV files and instantly analyze thousands of customer reviews using AI.",
  },
  {
    icon: AlertTriangle,
    title: "Detect Safety Risks",
    description: "Identify dangerous complaints like chemical burns, allergic reactions, and choking hazards early.",
  },
  {
    icon: ShieldCheck,
    title: "Stop Fake Reviews",
    description: "AI authenticity scoring detects suspicious or competitor-generated reviews.",
  },
];

const steps = [
  { icon: Upload, step: "Step 1", text: "Upload product reviews CSV" },
  { icon: Brain, step: "Step 2", text: "AI analyzes safety signals" },
  { icon: Bell, step: "Step 3", text: "Receive alerts for critical hazards" },
];

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <LandingNavbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-16 md:py-24 text-center animate-fade-in">
        <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 mb-4 md:mb-6">
          <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
        </div>
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3 md:mb-4 max-w-3xl mx-auto leading-tight">
          The AI Safety Bodyguard for Your Brand
        </h1>
        <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto mb-6 md:mb-8">
          Safety Signal AI scans thousands of product reviews to detect hidden safety hazards, legal risks, and fake competitor attacks before they become lawsuits.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 md:gap-4">
          <Button asChild size="lg">
            <Link to="/login">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <h2 className="text-xl md:text-2xl font-bold text-foreground text-center mb-8 md:mb-10">What Safety Signal AI Does</h2>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {features.map((f) => (
            <Card key={f.title} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 md:p-6 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 mb-3 md:mb-4">
                  <f.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-6 py-12 md:py-16">
        <h2 className="text-xl md:text-2xl font-bold text-foreground text-center mb-8 md:mb-10">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {steps.map((s) => (
            <div key={s.step} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-primary/10 flex items-center justify-center mb-3 md:mb-4">
                <s.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
              </div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{s.step}</span>
              <p className="text-xs md:text-sm text-muted-foreground">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © 2026 Safety Signal AI. All rights reserved.
      </footer>
    </div>
  );
};

export default LandingPage;

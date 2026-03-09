import { Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const LandingNavbar = () => {
  return (
    <nav className="w-full border-b border-border bg-background">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-foreground">Safety Signal AI</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Home</Link>
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Login</Link>
          <Button asChild size="sm">
            <Link to="/login">Get Started</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;

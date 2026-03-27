import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Eye, EyeOff, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    if (isLogin) {
      const result = await login(email, password);

      if (result.success) {
        toast({ 
          title: "Welcome back to Safety Signal AI!",
          description: "You have successfully signed in."
        });

        // ✅ FIX: wait a bit for session to stabilize
        setTimeout(() => {
          navigate("/dashboard");
        }, 100);

      } else {
        if (result.error?.includes("verify your email")) {
          toast({ 
            title: "Please verify your email", 
            description: "Check your email for a verification link before logging in.", 
            variant: "destructive" 
          });
        } else {
          toast({ 
            title: "Login failed", 
            description: result.error || "Please check your email and password.", 
            variant: "destructive" 
          });
        }
      }

    } else {
      if (!name.trim()) {
        toast({ 
          title: "Signup failed", 
          description: "Please enter your name.", 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      const result = await signup(email, password, name);

      if (result.success) {
        toast({ 
          title: "Account created successfully!",
          description: "Please check your email to verify your account before logging in."
        });

        setIsLogin(true);
      } else {
        toast({ 
          title: "Signup failed", 
          description: result.error || "Please try again.", 
          variant: "destructive" 
        });
      }
    }
  } catch (error) {
    toast({ 
      title: "An error occurred", 
      description: "Please try again later.", 
      variant: "destructive" 
    });
  } finally {
    setLoading(false);
  }
};

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-6 h-6 md:w-8 md:h-8 text-primary" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground mb-2">Safety Signal AI</h1>
          <p className="text-sm md:text-base text-muted-foreground">Your AI-powered safety bodyguard</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 md:p-8 shadow-lg">
          <div className="flex space-x-2 mb-6">
            <Button
              variant={isLogin ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsLogin(true)}
            >
              Sign In
            </Button>
            <Button
              variant={!isLogin ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="your@email.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                autoComplete="email"
              />
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="John Doe" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    required 
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder={isLogin ? "Your password" : "Create a password"} 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (isLogin ? "Signing in…" : "Creating account…") : (isLogin ? "Sign In" : "Sign Up")}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

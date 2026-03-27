import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const EmailVerificationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get verification parameters from URL
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (!token || type !== 'email') {
          setStatus('error');
          setError('Invalid verification link');
          return;
        }

        // Verify the email with Supabase
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email'
        });

        if (error) {
          setStatus('error');
          setError(error.message);
          toast({
            title: "Verification failed",
            description: error.message,
            variant: "destructive"
          });
        } else {
          setStatus('success');
          toast({
            title: "Email verified successfully!",
            description: "You can now log in to your account."
          });
          
          // Auto-redirect to login after 2 seconds
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        }
      } catch (err: any) {
        setStatus('error');
        setError(err.message || 'An error occurred during verification');
        toast({
          title: "Verification failed",
          description: err.message || "An error occurred during verification",
          variant: "destructive"
        });
      }
    };

    verifyEmail();
  }, [searchParams, navigate, toast]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleRetry = () => {
    navigate('/login');
  };

  const handleResend = async () => {
    // This would need to be implemented based on your signup flow
    toast({
      title: "Resend verification",
      description: "Please contact support to resend verification email."
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Email Verification</h1>
          <p className="text-muted-foreground mt-1">Verifying your email address...</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          {status === 'verifying' && (
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Verifying your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Email Verified Successfully!</h2>
              <p className="text-muted-foreground">Your email has been verified. You can now log in to your account.</p>
              <div className="animate-pulse text-sm text-muted-foreground">Redirecting to login in 2 seconds...</div>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 text-red-600 mb-4">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Verification Failed</h2>
              <p className="text-muted-foreground">{error}</p>
              <div className="space-y-2">
                <Button onClick={handleRetry} className="w-full">
                  Go to Login
                </Button>
                <Button variant="outline" onClick={handleResend} className="w-full">
                  Need Help?
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationPage;
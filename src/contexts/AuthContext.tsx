import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  isAuthenticated: boolean;
  user: { email: string; name: string } | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ email: string; name: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user: supabaseUser }, error } = await supabase.auth.getUser();

        if (error) {
          console.warn("Auth check failed:", error.message);
          return;
        }

        if (supabaseUser) {
          // Set basic user immediately
          setUser({
            email: supabaseUser.email!,
            name: supabaseUser.email!.split("@")[0],
          });

          // Fetch profile in background (non-blocking)
          setTimeout(async () => {
            try {
              const { data: profile } = await supabase
                .from("profiles")
                .select("name")
                .eq("id", supabaseUser.id)
                .single();

              if (profile?.name) {
                setUser({
                  email: supabaseUser.email!,
                  name: profile.name,
                });
              }
            } catch (err) {
              console.warn("Profile fetch failed:", err);
            }
          }, 0);
        }
      } catch (error) {
        console.warn("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    // ✅ FIXED: non-blocking auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Set immediately
        setUser({
          email: session.user.email!,
          name: session.user.email!.split("@")[0],
        });

        // Fetch profile async (non-blocking)
        setTimeout(async () => {
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("name")
              .eq("id", session.user.id)
              .single();

            if (profile?.name) {
              setUser({
                email: session.user.email!,
                name: profile.name,
              });
            }
          } catch (err) {
            console.warn("Profile fetch failed:", err);
          }
        }, 0);
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && !data.user.email_confirmed_at) {
        return { success: false, error: "Please verify your email before logging in." };
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred during login" };
    }
  };

  const signup = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            name: name,
            email: email,
          });

        // ❌ REMOVED admin.deleteUser (was breaking flow)
        if (profileError) {
          return { success: false, error: "Failed to create user profile" };
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred during signup" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
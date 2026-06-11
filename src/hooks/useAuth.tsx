import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import { demoProfile, demoUser, isDemoAuthEnabled, setDemoAuthEnabled } from "@/lib/demoAuth";

interface Profile {
  id: string;
  user_id: string;
  nickname: string;
  age_range: string | null;
  job_group: string | null;
  area: string | null;
  talk_topics: string[];
  networking_enabled: boolean;
  available_now: boolean;
}

interface Ctx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isDemo: boolean;
  signInDemo: () => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<Ctx>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  isDemo: false,
  signInDemo: () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(() => isDemoAuthEnabled());

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    setProfile((data as Profile) ?? null);
  };

  useEffect(() => {
    if (isDemo) {
      setSession(null);
      setProfile(demoProfile as Profile);
      setLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        setTimeout(() => loadProfile(s.user.id), 0);
      } else {
        setProfile(null);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) loadProfile(data.session.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [isDemo]);

  const signInDemo = () => {
    setDemoAuthEnabled(true);
    setIsDemo(true);
    setSession(null);
    setProfile(demoProfile as Profile);
    setLoading(false);
  };

  const signOut = async () => {
    setDemoAuthEnabled(false);
    setIsDemo(false);
    await supabase.auth.signOut();
    setProfile(null);
  };

  const refreshProfile = async () => {
    if (isDemo) {
      setProfile(demoProfile as Profile);
      return;
    }
    if (session?.user) await loadProfile(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user: isDemo ? demoUser : session?.user ?? null,
        session,
        profile,
        loading,
        isDemo,
        signInDemo,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

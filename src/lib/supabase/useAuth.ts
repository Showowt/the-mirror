"use client";

import { useEffect, useState, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { getSupabaseClient } from "./client";

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
  });

  useEffect(() => {
    const supabase = getSupabaseClient();

    // Get initial session
    supabase.auth
      .getSession()
      .then(
        ({
          data: { session: currentSession },
        }: {
          data: { session: Session | null };
        }) => {
          setState({
            user: currentSession?.user ?? null,
            session: currentSession,
            loading: false,
          });
        },
      );

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event: string, currentSession: Session | null) => {
        setState({
          user: currentSession?.user ?? null,
          session: currentSession,
          loading: false,
        });
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithEmail = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    },
    [],
  );

  const signUpWithEmail = useCallback(
    async (email: string, password: string) => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { data, error };
    },
    [],
  );

  const signInWithMagicLink = useCallback(async (email: string) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  }, []);

  return {
    user: state.user,
    session: state.session,
    loading: state.loading,
    isAuthenticated: !!state.user,
    signInWithEmail,
    signUpWithEmail,
    signInWithMagicLink,
    signOut,
  };
}

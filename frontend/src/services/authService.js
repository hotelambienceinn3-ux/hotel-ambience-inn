import { supabase } from '../lib/supabaseClient';

/**
 * Real Supabase Auth Service
 * Fetches authenticated user sessions and user roles directly from `public.profiles`.
 */
export const authService = {
  /**
   * Register a new user with Email and Password
   */
  signUp: async (email, password, fullName) => {
    if (!email || !password || !fullName) {
      throw new Error("Please complete all required registration fields.");
    }
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message || "Failed to sign up.");
    }

    return data;
  },

  /**
   * Log in an existing user with Email and Password
   */
  signIn: async (email, password) => {
    if (!email || !password) {
      throw new Error("Please enter both email and password.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message?.toLowerCase().includes("invalid login credentials")) {
        throw new Error("Invalid email or password. Please try again.");
      }
      if (error.message?.toLowerCase().includes("email not confirmed")) {
        throw new Error("Email address not confirmed. Please check your inbox for the verification link.");
      }
      throw new Error(error.message || "Failed to sign in.");
    }

    return data;
  },

  /**
   * Log in / Sign up with Google OAuth via Supabase
   */
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      throw new Error(error.message || "Failed to sign in with Google.");
    }

    return data;
  },

  /**
   * Sign out the currently authenticated user
   */
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw new Error(error.message || "Failed to sign out.");
    }
  },

  /**
   * Send a password reset email
   */
  resetPassword: async (email) => {
    if (!email) {
      throw new Error("Please enter your email address to reset password.");
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/`,
    });

    if (error) {
      throw new Error(error.message || "Failed to send password reset email.");
    }

    return data;
  },

  /**
   * Retrieve active session from Supabase
   */
  getCurrentSession: async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(error.message || "Failed to get session.");
    }
    return data.session;
  },

  /**
   * Retrieve active authenticated auth user
   */
  getCurrentUser: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      return null;
    }
    return data.user;
  },

  /**
   * Fetch matching row from public.profiles table using auth user ID
   * Role MUST come from public.profiles.role
   */
  getUserProfile: async (userId) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.warn(`Profile not found or error loading profile for user ${userId}:`, error.message);
      return null;
    }

    return data;
  },

  /**
   * Helper method to update profile data in public.profiles table
   */
  updateUserProfile: async (userId, updates) => {
    if (!userId) throw new Error("User ID is required.");

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || "Failed to update profile.");
    }

    return data;
  }
};

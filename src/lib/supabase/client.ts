import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENV, isSupabaseConfigured } from '@/config/env';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(ENV.supabaseUrl, ENV.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }

  return supabaseInstance;
}


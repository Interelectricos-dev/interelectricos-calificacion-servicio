export const ENV = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    '',
  companyName: process.env.NEXT_PUBLIC_COMPANY_NAME || 'Intereléctricos',
  // Cooldown en horas antes de permitir volver a calificar al mismo asesor
  ratingCooldownHours: Number(process.env.NEXT_PUBLIC_RATING_COOLDOWN_HOURS || 3),
};

export function isSupabaseConfigured(): boolean {
  return Boolean(
    ENV.supabaseUrl &&
    ENV.supabaseUrl.startsWith('https://') &&
    ENV.supabaseAnonKey &&
    ENV.supabaseAnonKey.length > 10
  );
}


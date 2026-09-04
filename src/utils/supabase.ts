import { createClient } from '@supabase/supabase-js';

// Supabase client - la clave api.bible y demás secrets se moverán a Supabase Vault / Edge Functions
// para no exponer VITE_BIBLE_API_KEY en el bundle. Por ahora fallback a env directo.

const supabaseUrl = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as unknown as { env: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Helper para obtener bible key desde Supabase (cuando esté configurado)
// Ej futuro: supabase.functions.invoke('get-bible-key') o supabase.from('app_config').select('bible_api_key')
export async function getBibleApiKeyViaSupabase(): Promise<string | null> {
  if (!supabase) return null;
  try {
    // Placeholder: si creás una Edge Function 'bible-proxy', invocarla aquí
    // const { data } = await supabase.functions.invoke('bible-proxy', { body: { action: 'getKey' } });
    // return data?.key || null;
    return null;
  } catch {
    return null;
  }
}

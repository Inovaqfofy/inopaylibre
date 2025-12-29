// Supabase Types - Généré par Inopay Liberation
// Remplacez ces types par ceux de votre propre projet Supabase
// Utilisez: npx supabase gen types typescript --project-id="votre-project-id"

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      // Vos tables ici
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

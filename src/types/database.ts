export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      user_role: 'user' | 'professional' | 'admin';
      service_mode: 'online' | 'in_person' | 'hybrid';
      message_role: 'user' | 'assistant' | 'system';
    };
    CompositeTypes: Record<string, never>;
  };
};

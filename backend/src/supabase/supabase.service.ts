import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL || 'http://localhost:8000',
      process.env.SUPABASE_KEY || 'your-anon-key'
    );
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }
}

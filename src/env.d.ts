/// <reference types="astro/client" />

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types";

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      user?: {
        id: string;
        email?: string;
      } | null;
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_ANON_KEY: string;
  // OpenRouter/AI Configuration
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_BASE_URL: string;
  readonly AI_MODEL: string;
  readonly AI_MAX_TOKENS: string;
  readonly AI_TEMPERATURE: string;
  readonly APP_URL: string;
  readonly APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

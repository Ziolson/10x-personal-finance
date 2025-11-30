import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;

  // TODO: Replace with real authentication when Supabase Auth is implemented
  // For now, use a mock user ID for testing purposes
  // This allows testing the API with curl/Postman without authentication
  context.locals.user = {
    id: "0772c42f-e30f-499b-a35e-b3e988bed1c1", // Mock UUID for testing
    email: "ziolson92@gmail.com",
  };

  return next();
});

import { defineMiddleware } from "astro:middleware";

import { supabaseClient } from "../db/supabase.client";

export const onRequest = defineMiddleware((context, next) => {
  context.locals.supabase = supabaseClient;

  // TODO: Replace with real authentication when Supabase Auth is implemented
  // For now, use a mock user ID for testing purposes
  // This allows testing the API with curl/Postman without authentication
  context.locals.user = {
    id: "0026af4b-ae2d-43bb-a184-32fc9c8eaec8", // Mock UUID for testing
    email: "test@example.com",
  };

  return next();
});

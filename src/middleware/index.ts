import { defineMiddleware } from "astro:middleware";
import { createSupabaseServerInstance } from "../db/supabase.server";

// Public paths that don't require authentication
const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/auth/reset-password", "/auth/callback"];

// API paths that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/logout", // Logout can be public (if session invalid, it just clears cookies)
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/callback",
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { url, request, cookies, redirect, locals } = context;
  const pathname = url.pathname;

  // 1. Create Supabase server client
  const supabase = createSupabaseServerInstance({
    headers: request.headers,
    cookies: cookies,
  });

  // 2. Validate session
  // IMPORTANT: calling getUser() fetches the user from Supabase Auth using the access token in cookies
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 3. Update locals
  locals.supabase = supabase;
  locals.user = user
    ? {
        id: user.id,
        email: user.email,
      }
    : undefined;

  // 4. Route Protection Logic

  // Check if it's a public route or asset
  const isPublicRoute =
    PUBLIC_ROUTES.some((route) => pathname === route) ||
    PUBLIC_API_ROUTES.some((route) => pathname === route) ||
    pathname.startsWith("/_image") || // Astro image optimization
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(css|js|jpg|png|svg|ico)$/); // Static assets

  // Scenario A: User is NOT logged in
  if (!user && !isPublicRoute) {
    // If trying to access protected API, return 401
    if (pathname.startsWith("/api/")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }
    // Otherwise redirect to login
    return redirect("/login");
  }

  // Scenario B: User IS logged in but tries to access Auth pages (login/register)
  if (user && (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password")) {
    return redirect("/");
  }

  return next();
});

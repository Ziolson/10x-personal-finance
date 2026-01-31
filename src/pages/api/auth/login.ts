import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.server";
import { isRateLimited } from "../../../lib/rate-limiter";

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    const ip = clientAddress || "unknown";

    // Rate limit: 5 requests per 1 minute
    if (isRateLimited(ip, { windowMs: 60 * 1000, max: 5 })) {
      return new Response(JSON.stringify({ error: "Too many login attempts. Please try again later." }), {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
      });
    }

    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 401,
      });
    }

    return new Response(JSON.stringify({ user: data.user, session: data.session }), {
      status: 200,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Login Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
};

import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../db/supabase.server";

export const GET: APIRoute = async ({ url, cookies, redirect, request }) => {
  const authCode = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/";

  if (!authCode) {
    return new Response("No code provided", { status: 400 });
  }

  const supabase = createSupabaseServerInstance({
    headers: request.headers,
    cookies,
  });

  const { error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return redirect(next);
};

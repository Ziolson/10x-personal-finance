import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../../db/supabase.server";

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // You can add data to public.users table trigger here if needed,
        // or just rely on metadata
      },
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ user: data.user, session: data.session }), {
      status: 200,
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Register Error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
};

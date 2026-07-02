/**
 * @fileoverview Reusable authentication guard for Supabase Edge Functions.
 * Verifies the JWT from the Authorization header to protect endpoints.
 */

import { createClient, User } from '@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

/**
 * Requires a valid user session to proceed.
 * Extracts the JWT from the request, verifies it with Supabase Auth,
 * and returns a 401 response if authentication fails.
 *
 * @param req The incoming HTTP request.
 * @returns A promise that resolves to an object containing either the authenticated user or an error response.
 */
export async function requireUser(
  req: Request,
): Promise<{ user: User | null; error: Response | null }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Missing auth token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }),
    };
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      user: null,
      error: new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }),
    };
  }

  return { user, error: null };
}

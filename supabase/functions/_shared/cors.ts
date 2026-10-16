export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

export function handleOptions(): Response {
  return new Response(null, { status: 200, headers: corsHeaders })
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status)
}

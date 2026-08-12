import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const allowedTasks = new Set(["voice", "scan"]);
const allowedProviders = new Set(["auto", "gemini", "gpt", "deepseek", "kimi", "grok"]);

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405,
      headers: { "content-type": "application/json" },
    });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  if (body?.product !== "lingguang-health-os") {
    return new Response(JSON.stringify({ error: "Invalid product" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!allowedTasks.has(body?.task)) {
    return new Response(JSON.stringify({ error: "Invalid task" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (!allowedProviders.has(body?.provider || "auto")) {
    return new Response(JSON.stringify({ error: "Invalid provider" }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  // Provider adapters are intentionally not enabled until their server-side
  // secrets are configured on the dedicated LINGGUANG Supabase project.
  return new Response(JSON.stringify({
    ok: false,
    configured: false,
    message: "LINGGUANG secure AI gateway is deployed but provider secrets are not configured yet.",
  }), {
    status: 503,
    headers: { "content-type": "application/json" },
  });
});

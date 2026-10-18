import { secrets } from "base44:runtime";
import { createClientFromRequest } from "npm:@base44/sdk@0.8.52";

// Admin-only one-click config sync: copies the TON_DEPOSIT_ADDRESS secret
// (set in this app's environment) into the Supabase Edge Function environment,
// where the bot's TON top-up flow reads it. The address value is never returned.

const SUPABASE_REF = "kiglmpxkilgwzkuewuvb";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin only" }, { status: 403 });
    }
    const address = String(secrets.get("TON_DEPOSIT_ADDRESS") || "").trim();
    if (!address) {
      return Response.json({ error: "TON_DEPOSIT_ADDRESS secret is not set" }, { status: 400 });
    }
    const res = await fetch(
      `https://api.supabase.com/v1/projects/${SUPABASE_REF}/secrets`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${secrets.get("SUPABASE_ACCESS_TOKEN")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{ name: "TON_DEPOSIT_ADDRESS", value: address, type: "api" }]),
        signal: AbortSignal.timeout(20000),
      }
    );
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      return Response.json(
        { error: (j && j.message) || `Sync failed (${res.status})` },
        { status: 500 }
      );
    }
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
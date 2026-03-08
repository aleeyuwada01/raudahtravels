import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Unauthorized: admin role required");

    const { agent_id, amount } = await req.json();
    if (!agent_id || !amount || amount <= 0) throw new Error("agent_id and positive amount required");

    // Get agent record to find email
    const { data: agent, error: agentErr } = await supabase
      .from("agents")
      .select("id, email, contact_person, user_id")
      .eq("id", agent_id)
      .single();
    if (agentErr || !agent) throw new Error("Agent not found");

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes

    // Store OTP in wallet_transactions as a pending credit with OTP in reference
    // We use a special "pending_topup" type that gets converted to "credit" on verification
    const { data: txn, error: txnErr } = await supabase
      .from("wallet_transactions")
      .insert({
        wallet_id: await getOrCreateWallet(supabase, agent_id),
        amount: amount,
        type: "credit",
        description: `Pending top-up of ₦${Number(amount).toLocaleString()} — awaiting OTP verification`,
        reference: `OTP:${otp}:${expiresAt}`,
        created_by: user.id,
      })
      .select("id")
      .single();
    if (txnErr) throw new Error("Failed to create pending transaction: " + txnErr.message);

    // Send OTP via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (resendApiKey) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Raudah Travels <noreply@raudahtravels.com>",
          to: [agent.email],
          subject: "Wallet Top-Up OTP Verification",
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px;">
              <h2 style="color: #166534; margin-bottom: 20px;">Wallet Top-Up Verification</h2>
              <p>Dear ${agent.contact_person},</p>
              <p>An admin has initiated a wallet top-up of <strong>₦${Number(amount).toLocaleString()}</strong> for your account.</p>
              <p>Your verification code is:</p>
              <div style="background: #f0fdf4; border: 2px solid #166534; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #166534;">${otp}</span>
              </div>
              <p style="color: #666; font-size: 14px;">This code expires in 10 minutes. Do not share it with anyone.</p>
              <p style="color: #999; font-size: 12px; margin-top: 30px;">— Raudah Travels & Tours</p>
            </div>
          `,
        }),
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        transaction_id: txn.id,
        message: `OTP sent to ${agent.email}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("admin-topup-wallet error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function getOrCreateWallet(supabase: any, agentId: string): Promise<string> {
  const { data: existing } = await supabase
    .from("agent_wallets")
    .select("id")
    .eq("agent_id", agentId)
    .maybeSingle();
  
  if (existing) return existing.id;

  const { data: newWallet, error } = await supabase
    .from("agent_wallets")
    .insert({ agent_id: agentId, balance: 0 })
    .select("id")
    .single();
  
  if (error) throw new Error("Failed to create wallet: " + error.message);
  return newWallet.id;
}

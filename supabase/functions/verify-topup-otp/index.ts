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

    const { transaction_id, otp } = await req.json();
    if (!transaction_id || !otp) throw new Error("transaction_id and otp required");

    // Get the pending transaction
    const { data: txn, error: txnErr } = await supabase
      .from("wallet_transactions")
      .select("id, wallet_id, amount, reference, type")
      .eq("id", transaction_id)
      .single();
    if (txnErr || !txn) throw new Error("Transaction not found");

    // Parse OTP from reference
    const refParts = (txn.reference || "").split(":");
    if (refParts.length < 3 || refParts[0] !== "OTP") {
      throw new Error("Invalid transaction — not a pending top-up");
    }

    const storedOtp = refParts[1];
    const expiresAt = new Date(refParts[2]);

    if (new Date() > expiresAt) {
      // Delete expired transaction
      await supabase.from("wallet_transactions").delete().eq("id", transaction_id);
      throw new Error("OTP has expired. Please initiate a new top-up.");
    }

    if (otp !== storedOtp) {
      throw new Error("Invalid OTP code");
    }

    // OTP verified! Update transaction to confirmed
    const { error: updateErr } = await supabase
      .from("wallet_transactions")
      .update({
        reference: `TOPUP-${Date.now().toString(36).toUpperCase()}`,
        description: `Wallet top-up of ₦${Number(txn.amount).toLocaleString()} — verified`,
      })
      .eq("id", transaction_id);
    if (updateErr) throw new Error("Failed to update transaction");

    // Credit the wallet
    const { error: walletErr } = await supabase.rpc("credit_wallet", {
      _wallet_id: txn.wallet_id,
      _amount: txn.amount,
    });
    
    // If RPC doesn't exist yet, fall back to direct update
    if (walletErr) {
      const { data: wallet } = await supabase
        .from("agent_wallets")
        .select("balance")
        .eq("id", txn.wallet_id)
        .single();
      
      const newBalance = Number(wallet?.balance || 0) + Number(txn.amount);
      
      const { error: directErr } = await supabase
        .from("agent_wallets")
        .update({ balance: newBalance })
        .eq("id", txn.wallet_id);
      if (directErr) throw new Error("Failed to credit wallet: " + directErr.message);
    }

    // Get updated balance
    const { data: updatedWallet } = await supabase
      .from("agent_wallets")
      .select("balance")
      .eq("id", txn.wallet_id)
      .single();

    return new Response(
      JSON.stringify({ 
        success: true, 
        new_balance: updatedWallet?.balance || 0,
        message: "Wallet topped up successfully" 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("verify-topup-otp error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

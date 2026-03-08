
CREATE TABLE IF NOT EXISTS public.agent_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can view own wallet" ON public.agent_wallets FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.agents a WHERE a.id = agent_wallets.agent_id AND a.user_id = auth.uid()));
CREATE POLICY "Admins can manage all wallets" ON public.agent_wallets FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.agent_wallets(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  type text NOT NULL,
  description text,
  reference text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Agents can view own transactions" ON public.wallet_transactions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.agent_wallets w
    JOIN public.agents a ON a.id = w.agent_id
    WHERE w.id = wallet_transactions.wallet_id AND a.user_id = auth.uid()
  ));
CREATE POLICY "Admins can manage all transactions" ON public.wallet_transactions FOR ALL
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_agent_wallets_updated_at BEFORE UPDATE ON public.agent_wallets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

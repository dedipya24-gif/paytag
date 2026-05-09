# PayTag — Pay to Unlock

**Sell any digital content for crypto. Share one link, set a price, fans pay from any chain — content unlocks instantly.**

> Built for the KIRAPAY Frontier Hackathon

[Live Demo](#) · [Video Demo](#) · [Project Write-Up](#)

---

## What is PayTag?

PayTag lets creators gate digital content behind a crypto paywall. Figma templates, Discord invites, PDFs, passwords, secret URLs — anything. A fan visits the creator's link, pays in any token from any chain via KIRAPAY's checkout, and the content is revealed on screen the moment payment is confirmed.

No Stripe. No PayPal. No bank account required — for either side.

---

## The Problem

Stripe operates in about 47 countries. The world has 195. Hundreds of millions of creators in Africa, Southeast Asia, and South America have real audiences and real skills — but no way to get paid for their digital work.

They have crypto wallets. Their fans have crypto wallets. The infrastructure to connect them just didn't exist.

PayTag is that bridge.

---

## How It Works

**Creator setup (2 minutes):**
1. Sign up with Google → connect MetaMask wallet → pick a username
2. Add your gated content: title, description, price, and a secret (URL or message)
3. Choose which chain you want to receive USDC on
4. Share your PayTag link: `paytag.app/yourname`

**Buyer flow:**
1. Visit a creator's PayTag link
2. See the locked card — title, description, price
3. Click **"Unlock for $X"**
4. Pay with any token on any chain via KIRAPAY's hosted checkout
5. Land on the reveal page — secret content unlocks the moment payment clears

---

## KIRAPAY Integration

KIRAPAY is not an add-on here — it's the entire payment layer. Without it, PayTag doesn't exist.

### Per-creator payment links

Every time a fan clicks "Unlock", our server calls KIRAPAY's `POST /api/link/generate` with the creator's own wallet as `receiver`. Money goes directly from buyer to creator — PayTag never holds funds.

```json
{
  "tokenOut": { "chainId": "8453", "address": "0x833589...USDC-on-Base" },
  "receiver": "0xCreatorWalletAddress",
  "originalPrice": 15,
  "fiatCurrency": "USD",
  "name": "Figma UI Kit — 50 premium components",
  "customOrderId": "our-payment-uuid",
  "redirectUrl": "https://paytag.app/unlock/our-payment-uuid",
  "type": "single_use"
}
```

- `type: "single_use"` — each link is tied to one purchase, expires after use
- `customOrderId` — our payment UUID, used to match the webhook back to our DB
- `receiver` — the creator's own wallet. We are only the routing layer.

### Dynamic multi-chain settlement

Creators choose which chain they receive USDC on — Base, Ethereum, Polygon, Arbitrum, Optimism, BNB Chain, or Avalanche. This is stored in their profile and passed as `tokenOut` on every payment link.

A fan pays ETH on Polygon. The creator receives USDC on Base. KIRAPAY handles the cross-chain swap. Neither side needs to think about it.

### Webhook-driven content reveal

After payment, KIRAPAY fires a `transaction.succeeded` webhook to `POST /api/webhook`. We match it to our payment record via `customOrderId`, flip the status to `succeeded`, and store settlement details (tx hash, amount, source token, source chain).

The buyer's browser polls `/api/payment-status` every 2 seconds. The moment the webhook hits, the next poll returns the secret content. The content appears — no page reload, no email.

```
Fan pays
  → KIRAPAY checkout
  → transaction.succeeded webhook
  → Supabase updated
  → Client poll detects success
  → Secret content revealed
```

End-to-end: typically under 10 seconds from payment confirmation to content reveal.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Auth | Clerk |
| Database | Supabase (PostgreSQL) |
| Wallet Connect | RainbowKit + Wagmi + Viem |
| Payments | KIRAPAY |
| Hosting | Vercel |
| Styling | Tailwind CSS v4 |

---

## Architecture Overview

```
Creator adds content + chooses settlement chain
              ↓
     paytag.app/username (locked card)
              ↓
         Fan clicks "Unlock"
              ↓
  POST /api/create-payment (server)
    • Insert pending payment → Supabase
    • POST /link/generate → KIRAPAY (receiver = creator wallet)
    • Return checkout URL
              ↓
  Fan redirected to KIRAPAY checkout
  Pays with any token, any chain
              ↓
  KIRAPAY redirects to /unlock/[orderId]
  Client polls /api/payment-status every 2s
              ↓
  KIRAPAY fires POST /api/webhook
    • Match by customOrderId
    • Update payment → "succeeded" in Supabase
              ↓
  Poll detects success → secret content revealed
```

---

## Local Setup

**Requirements:** Node.js 18+, Supabase account, Clerk account, KIRAPAY API key

```bash
git clone https://github.com/yourusername/paytag
cd paytag
npm install
cp .env.local.example .env.local
# Fill in your keys, then:
npm run dev
```

**Supabase schema** — run this in your Supabase SQL Editor:

```sql
create table users (
  id uuid primary key default gen_random_uuid(),
  clerk_id text unique not null,
  username text unique not null,
  wallet_address text not null,
  display_name text,
  bio text,
  avatar_url text,
  settlement_chain_id text default '8453',
  settlement_token_address text default '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  created_at timestamptz default now()
);

create table unlockables (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references users(id) on delete cascade,
  title text not null,
  description text,
  price_usd numeric not null,
  secret_content text not null,
  secret_type text default 'link',
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references users(id),
  unlockable_id uuid references unlockables(id),
  kirapay_link_id text,
  amount_usd numeric,
  token_in_symbol text,
  source_chain_id integer,
  settlement_amount numeric,
  tx_hash text,
  status text,
  sender_address text,
  created_at timestamptz default now()
);
```

**Register the KIRAPAY webhook** (after deploying to a public URL):

```bash
curl -X POST https://api.kira-pay.com/api/webhooks \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_KIRAPAY_API_KEY" \
  -d '{"url": "https://your-app.vercel.app/api/webhook", "secret": "your_secret"}'
```

---

## Environment Variables

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# KIRAPAY (server-side only — never expose as NEXT_PUBLIC_)
KIRAPAY_API_KEY=kp_...

# App
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

---

## Project Structure

```
app/
  page.tsx                    # Landing page
  signup/page.tsx             # Creator onboarding
  [username]/
    page.tsx                  # Public unlock page
    UnlockWidget.tsx          # "Unlock for $X" button
  dashboard/page.tsx          # Creator dashboard
  unlock/[orderId]/page.tsx   # Payment confirm + content reveal
  demo/page.tsx               # Static demo (no real payment)
  api/
    create-payment/route.ts   # POST → generate KIRAPAY checkout link
    webhook/route.ts          # POST → receive KIRAPAY transaction events
    payment-status/route.ts   # GET  → poll payment status + return secret
    create-unlock/route.ts    # POST → save gated content
    create-user/route.ts      # POST → save creator profile
    me/route.ts               # GET  → dashboard data
lib/
  kirapay.ts                  # KIRAPAY API wrapper
  supabase.ts                 # Supabase client + types
  chains.ts                   # Supported settlement chains + USDC addresses
```

---

## License

MIT

const KIRAPAY_BASE = 'https://api.kira-pay.com/api'
const KIRAPAY_API_KEY = process.env.KIRAPAY_API_KEY!

// USDC on Base (chainId 8453)
const DEFAULT_TOKEN_OUT = {
  chainId: '8453',
  address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
}

type CreateLinkParams = {
  receiverWallet: string
  amountUsd: number
  itemTitle: string
  orderId: string
  redirectUrl: string
  tokenOut?: { chainId: string; address: string }
}

type CreateLinkResponse = {
  url: string
  price: number
  linkId: string
}

export async function createPaymentLink(params: CreateLinkParams): Promise<CreateLinkResponse> {
  const res = await fetch(`${KIRAPAY_BASE}/link/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KIRAPAY_API_KEY,
    },
    body: JSON.stringify({
      tokenOut: params.tokenOut || DEFAULT_TOKEN_OUT,
      receiver: params.receiverWallet,
      originalPrice: params.amountUsd,
      fiatCurrency: 'USD',
      name: params.itemTitle,
      customOrderId: params.orderId,
      redirectUrl: params.redirectUrl,
      type: 'single_use',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`KIRAPAY error ${res.status}: ${JSON.stringify(err)}`)
  }

  const json = await res.json()
  // Extract link ID from the checkout URL (last path segment)
  const linkId = (json.data._id ?? json.data.url?.split('/').pop()) as string
  return { url: json.data.url, price: json.data.price, linkId }
}

export async function getTransactions(page = 1, limit = 20, key?: string) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) })
  if (key) params.set('key', key)
  const res = await fetch(
    `${KIRAPAY_BASE}/wallet/transactions?${params}`,
    { headers: { 'x-api-key': KIRAPAY_API_KEY } }
  )
  if (!res.ok) throw new Error(`KIRAPAY transactions error ${res.status}`)
  const json = await res.json()
  // Handle both response shapes: { data: { transactions } } and { transactions } at root
  return json.data ?? json
}

export async function registerWebhook(url: string, secret: string) {
  const res = await fetch(`${KIRAPAY_BASE}/webhooks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': KIRAPAY_API_KEY,
    },
    body: JSON.stringify({ url, secret }),
  })
  if (!res.ok) throw new Error(`KIRAPAY webhook reg error ${res.status}`)
  return res.json()
}
export type Chain = {
  name: string
  shortName: string
  chainId: string
  usdcAddress: string
  logoUrl: string
}

export const SUPPORTED_CHAINS: Chain[] = [
  {
    name: 'Base',
    shortName: 'Base',
    chainId: '8453',
    usdcAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_base.jpg',
  },
  {
    name: 'Ethereum',
    shortName: 'ETH',
    chainId: '1',
    usdcAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_ethereum.jpg',
  },
  {
    name: 'Polygon',
    shortName: 'Polygon',
    chainId: '137',
    usdcAddress: '0x3c499c542cef5e3811e1192ce70d8cc03d5c3359',
    logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_polygon.jpg',
  },
  {
    name: 'Arbitrum One',
    shortName: 'Arbitrum',
    chainId: '42161',
    usdcAddress: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
    logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_arbitrum.jpg',
  },
  {
    name: 'Optimism',
    shortName: 'OP',
    chainId: '10',
    usdcAddress: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_optimism.jpg',
  },
  {
    name: 'BNB Smart Chain',
    shortName: 'BNB',
    chainId: '56',
    usdcAddress: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
    logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_binance.jpg',
  },
  {
    name: 'Avalanche',
    shortName: 'AVAX',
    chainId: '43114',
    usdcAddress: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
    logoUrl: 'https://icons.llamao.fi/icons/chains/rsz_avalanche.jpg',
  },
]

export const DEFAULT_CHAIN = SUPPORTED_CHAINS[0]

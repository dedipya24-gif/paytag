'use client'

import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { base, mainnet, polygon, bsc, arbitrum, optimism } from 'wagmi/chains'

export const wagmiConfig = getDefaultConfig({
  appName: 'PayTag',
  projectId: 'paytag-kirapay-hackathon',
  chains: [mainnet, base, polygon, bsc, arbitrum, optimism],
  ssr: true,
})
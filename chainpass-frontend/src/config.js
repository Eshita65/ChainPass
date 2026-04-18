import { createConfig, http, injected } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'

export const wagmiConfig = createConfig({
  chains: [sepolia],
  connectors: [
    injected({
      target: 'metaMask',
    }),
  ],
  transports: {
    [sepolia.id]: http("https://eth-sepolia.g.alchemy.com/v2/pLBITLbdi15I58YDLiuvt "),
  },
})

export const queryClient = new QueryClient()

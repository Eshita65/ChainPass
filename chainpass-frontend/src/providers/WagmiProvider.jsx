import { QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider as Provider } from 'wagmi'
import { queryClient, wagmiConfig } from '../config'

export default function WagmiProvider({ children }) {
  return (
    <Provider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </Provider>
  )
}

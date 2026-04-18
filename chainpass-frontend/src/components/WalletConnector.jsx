import { useAccount, useConnect, useDisconnect } from 'wagmi'

function formatAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

export default function WalletConnector() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending, pendingConnector } = useConnect()
  const { disconnect } = useDisconnect()

  const metaMaskConnector = connectors.find((connector) =>
    connector.name.toLowerCase().includes('metamask'),
  )

  if (isConnected && address) {
    return (
      <div className="wallet-card">
        <span className="status connected">Wallet connected</span>
        <p className="wallet-address" title={address}>
          {formatAddress(address)}
        </p>
        <p className="wallet-helper">{address}</p>
        <button
          type="button"
          className="wallet-button secondary"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <div className="wallet-card">
      <span className="status">Wallet disconnected</span>
      <button
        type="button"
        className="wallet-button"
        disabled={!metaMaskConnector || isPending}
        onClick={() => {
          if (metaMaskConnector) connect({ connector: metaMaskConnector })
        }}
      >
        {isPending && pendingConnector?.id === metaMaskConnector?.id
          ? 'Connecting...'
          : 'Connect MetaMask'}
      </button>
      {!metaMaskConnector && (
        <p className="wallet-helper">MetaMask was not detected in this browser.</p>
      )}
    </div>
  )
}

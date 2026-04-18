import { useState } from 'react'
import { formatEther, parseEther } from 'viem'
import { useReadContract, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi'

export default function ResalePanel() {
  const [tokenId, setTokenId] = useState('1')
  const [price, setPrice] = useState('')
  const [actionLabel, setActionLabel] = useState('')

  const { data: listing } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'resaleListings',
    args: [BigInt(tokenId || '1')],
  })

  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function handleListForResale() {
    setActionLabel('listed')
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'listForResale',
      args: [BigInt(tokenId), parseEther(price)],
    })
  }

  function handleBuyResaleTicket() {
    if (!listing?.active) return

    setActionLabel('bought')
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'buyResaleTicket',
      args: [BigInt(tokenId)],
      value: parseEther(formatEther(listing.resalePrice)),
    })
  }

  return (
    <section className="panel">
      <h2>Resale Panel</h2>

      <label className="field">
        <span className="label">Token ID</span>
        <input
          className="input"
          min="1"
          type="number"
          value={tokenId}
          onChange={(event) => setTokenId(event.target.value)}
        />
      </label>

      <label className="field">
        <span className="label">Resale Price (ETH)</span>
        <input
          className="input"
          min="0"
          step="0.0001"
          type="number"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>

      {listing?.active ? (
        <p className="muted-text">Active listing price: {formatEther(listing.resalePrice)} ETH</p>
      ) : (
        <p className="muted-text">No active resale listing for this token.</p>
      )}

      <div className="button-row">
        <button
          type="button"
          className="wallet-button"
          disabled={!price || isPending || isConfirming}
          onClick={handleListForResale}
        >
          List For Resale
        </button>
        <button
          type="button"
          className="wallet-button secondary"
          disabled={!listing?.active || isPending || isConfirming}
          onClick={handleBuyResaleTicket}
        >
          Buy Resale Ticket
        </button>
      </div>

      {hash && <p className="muted-text">Transaction hash: {hash}</p>}
      {error && <p className="error-text">{error.shortMessage || error.message}</p>}
      {isSuccess && (
        <p className="success-text">
          Ticket {actionLabel === 'listed' ? 'listed for resale' : 'resale purchase confirmed'}.
        </p>
      )}
    </section>
  )
}

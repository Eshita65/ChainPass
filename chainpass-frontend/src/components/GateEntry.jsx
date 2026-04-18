import { useState } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi'

export default function GateEntry() {
  const [tokenId, setTokenId] = useState('1')
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function handleMarkAsUsed() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'markAsUsed',
      args: [BigInt(tokenId)],
    })
  }

  return (
    <section className="panel">
      <h2>Gate Entry</h2>

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

      <button
        type="button"
        className="wallet-button"
        disabled={isPending || isConfirming}
        onClick={handleMarkAsUsed}
      >
        {isPending ? 'Confirm in MetaMask...' : isConfirming ? 'Waiting for receipt...' : 'Mark As Used'}
      </button>

      {hash && <p className="muted-text">Transaction hash: {hash}</p>}
      {error && <p className="error-text">{error.shortMessage || error.message}</p>}
      {isSuccess && <p className="success-text">Ticket marked as used successfully.</p>}
    </section>
  )
}

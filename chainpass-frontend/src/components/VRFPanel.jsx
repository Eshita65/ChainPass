import { useState } from 'react'
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi'

export default function VRFPanel() {
  const [eventId, setEventId] = useState('1')
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  function handleRequestWinner() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'requestReviewDropWinner',
      args: [BigInt(eventId)],
    })
  }

  return (
    <section className="panel">
      <h2>VRF Panel</h2>

      <label className="field">
        <span className="label">Event ID</span>
        <input
          className="input"
          min="1"
          type="number"
          value={eventId}
          onChange={(event) => setEventId(event.target.value)}
        />
      </label>

      <button
        type="button"
        className="wallet-button"
        disabled={isPending || isConfirming}
        onClick={handleRequestWinner}
      >
        {isPending ? 'Confirm in MetaMask...' : isConfirming ? 'Waiting for receipt...' : 'Trigger Random Winner'}
      </button>

      {hash && <p className="muted-text">Transaction hash: {hash}</p>}
      {error && <p className="error-text">{error.shortMessage || error.message}</p>}
      {isSuccess && <p className="success-text">VRF winner request confirmed.</p>}
    </section>
  )
}

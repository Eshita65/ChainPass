import { useEffect, useState } from 'react'
import {
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi'

export default function ReviewPanel() {
  const [eventId, setEventId] = useState('1')
  const [contentHash, setContentHash] = useState('')
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  const { data: eventData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEvent',
    args: [BigInt(eventId || '1')],
  })

  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000))
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  const isReviewOpen = eventData?.exists && now >= Number(eventData.eventEndTime)

  function handleSubmitReview() {
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'submitReview',
      args: [BigInt(eventId), contentHash.trim()],
    })
  }

  return (
    <section className="panel">
      <h2>Review Panel</h2>

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

      {!isReviewOpen && (
        <p className="muted-text">Review submission opens after the event ends. Current Unix time: {now}</p>
      )}

      {isReviewOpen && (
        <>
          <label className="field">
            <span className="label">Review Content Hash</span>
            <textarea
              className="input textarea"
              rows="4"
              value={contentHash}
              onChange={(event) => setContentHash(event.target.value)}
            />
          </label>

          <button
            type="button"
            className="wallet-button"
            disabled={!contentHash.trim() || isPending || isConfirming}
            onClick={handleSubmitReview}
          >
            {isPending ? 'Confirm in MetaMask...' : isConfirming ? 'Waiting for receipt...' : 'Submit Review'}
          </button>
        </>
      )}

      {hash && <p className="muted-text">Transaction hash: {hash}</p>}
      {error && <p className="error-text">{error.shortMessage || error.message}</p>}
      {isSuccess && <p className="success-text">Review submitted successfully.</p>}
    </section>
  )
}

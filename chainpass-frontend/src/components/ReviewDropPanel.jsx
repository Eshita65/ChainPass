import { useEffect, useState } from 'react'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi'

export default function ReviewDropPanel({ eventId = 1 }) {
  const [reviewText, setReviewText] = useState('Great event, smooth entry, and fair ticketing.')
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000))
  const [activeAction, setActiveAction] = useState(null)
  const { isConnected } = useAccount()

  const { data: eventData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEvent',
    args: [BigInt(eventId)],
  })

  const {
    data: hash,
    error,
    isPending,
    writeContract,
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [])

  const hasEventEnded = eventData ? now >= Number(eventData.eventEndTime) : false

  function handleSubmitReview() {
    setActiveAction('review')
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'submitReview',
      args: [BigInt(eventId), reviewText],
    })
  }

  function handleTriggerWinner() {
    setActiveAction('vrf')
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'requestReviewDropWinner',
      args: [BigInt(eventId)],
    })
  }

  return (
    <section className="panel">
      <h2>Step D: Review + VRF Drop</h2>
      {!hasEventEnded && (
        <p className="muted-text">
          Post-event actions unlock after the event end time. Current Unix time: {now}
        </p>
      )}

      {hasEventEnded && (
        <>
          <label className="field">
            <span className="label">Review text</span>
            <textarea
              className="input textarea"
              rows="4"
              value={reviewText}
              onChange={(event) => setReviewText(event.target.value)}
            />
          </label>

          <div className="button-row">
            <button
              type="button"
              className="wallet-button"
              disabled={!isConnected || !reviewText.trim() || isPending || isConfirming}
              onClick={handleSubmitReview}
            >
              Submit Review
            </button>

            <button
              type="button"
              className="wallet-button secondary"
              disabled={!isConnected || isPending || isConfirming}
              onClick={handleTriggerWinner}
            >
              Trigger Random Winner
            </button>
          </div>
        </>
      )}

      {error && <p className="error-text">{error.shortMessage || error.message}</p>}
      {hash && <p className="muted-text">Transaction hash: {hash}</p>}
      {isPending && <p className="muted-text">Approve the {activeAction === 'vrf' ? 'VRF request' : 'review'} in MetaMask.</p>}
      {isConfirming && <p className="muted-text">Waiting for the transaction receipt...</p>}
      {isSuccess && (
        <p className="success-text">
          {activeAction === 'vrf'
            ? 'Random winner request confirmed on-chain.'
            : 'Review submission confirmed on-chain.'}
        </p>
      )}
    </section>
  )
}

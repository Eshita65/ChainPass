import { useState } from 'react'
import { formatEther } from 'viem'
import { useReadContract } from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi'

function formatTimestamp(timestamp) {
  if (!timestamp) return 'Not set'
  return new Date(Number(timestamp) * 1000).toLocaleString()
}

export default function EventDashboard() {
  const [eventId, setEventId] = useState('1')

  const { data, isLoading, error } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEvent',
    args: [BigInt(eventId || '1')],
  })

  return (
    <section className="panel">
      <h2>Event Dashboard</h2>

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

      {isLoading && <p className="muted-text">Loading event details...</p>}
      {error && <p className="error-text">{error.shortMessage || error.message}</p>}

      {!isLoading && !error && !data?.exists && <p className="muted-text">Event not found.</p>}

      {!isLoading && !error && data?.exists && (
        <div className="detail-grid">
          <div>
            <span className="label">Ticket Price</span>
            <p>{formatEther(data.ticketPrice)} ETH</p>
          </div>
          <div>
            <span className="label">Supply</span>
            <p>Max Supply: {data.maxSupply.toString()}</p>
            <p>Total Minted: {data.totalMinted.toString()}</p>
          </div>
          <div>
            <span className="label">Timestamps</span>
            <p>Sale Start: {formatTimestamp(data.saleStartTime)}</p>
            <p>Sale End: {formatTimestamp(data.saleEndTime)}</p>
            <p>Event Start: {formatTimestamp(data.eventStartTime)}</p>
            <p>Event End: {formatTimestamp(data.eventEndTime)}</p>
          </div>
          <div>
            <span className="label">Cashback Pool</span>
            <p>{formatEther(data.cashbackPool)} ETH</p>
          </div>
        </div>
      )}
    </section>
  )
}

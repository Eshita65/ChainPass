import { useState } from 'react'
import { formatEther, parseEther } from 'viem'
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi'

export default function BuyTicketCard() {
  const [eventId, setEventId] = useState('1')
  const { isConnected } = useAccount()

  const { data: eventData } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'getEvent',
    args: [BigInt(eventId || '1')],
  })

  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const ticketPriceEth = eventData?.ticketPrice ? formatEther(eventData.ticketPrice) : '0'

  function handleBuyTicket() {
    if (!eventData?.exists) return

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'buyTicket',
      args: [BigInt(eventId)],
      value: parseEther(ticketPriceEth),
    })
  }

  return (
    <section className="panel">
      <h2>Buy Ticket</h2>

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

      <p className="muted-text">Ticket price: {ticketPriceEth} ETH</p>

      <button
        type="button"
        className="wallet-button"
        disabled={!isConnected || !eventData?.exists || isPending || isConfirming}
        onClick={handleBuyTicket}
      >
        {isPending ? 'Confirm in MetaMask...' : isConfirming ? 'Waiting for receipt...' : 'Buy Ticket'}
      </button>

      {!isConnected && <p className="muted-text">Connect MetaMask before buying a ticket.</p>}
      {hash && <p className="muted-text">Transaction hash: {hash}</p>}
      {error && <p className="error-text">{error.shortMessage || error.message}</p>}
      {isSuccess && <p className="success-text">Ticket purchase confirmed.</p>}
    </section>
  )
}

import { useMemo, useState } from 'react'
import { parseEther } from 'viem'
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi'

const initialForm = {
  name: '',
  venue: '',
  ticketPrice: '',
  maxSupply: '',
  saleStartTime: '',
  saleEndTime: '',
  eventStartTime: '',
  eventEndTime: '',
  cidUpcoming: '',
  cidLive: '',
  cidAttended: '',
  cashbackPool: '',
}

function toUnixSeconds(value) {
  return BigInt(Math.floor(new Date(value).getTime() / 1000))
}

export default function CreateEventForm() {
  const [form, setForm] = useState(initialForm)
  const [validationError, setValidationError] = useState('')
  const [submittedName, setSubmittedName] = useState('')
  const { isConnected } = useAccount()
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  const isBusy = isPending || isConfirming

  const timePreview = useMemo(() => {
    if (
      !form.saleStartTime ||
      !form.saleEndTime ||
      !form.eventStartTime ||
      !form.eventEndTime
    ) {
      return null
    }

    return {
      saleStartTime: toUnixSeconds(form.saleStartTime),
      saleEndTime: toUnixSeconds(form.saleEndTime),
      eventStartTime: toUnixSeconds(form.eventStartTime),
      eventEndTime: toUnixSeconds(form.eventEndTime),
    }
  }, [
    form.saleStartTime,
    form.saleEndTime,
    form.eventStartTime,
    form.eventEndTime,
  ])

  function updateField(event) {
    const { name, value } = event.target
    setForm((current) => ({
      ...current,
      [name]: value,
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()
    setValidationError('')

    const saleStartTime = toUnixSeconds(form.saleStartTime)
    const saleEndTime = toUnixSeconds(form.saleEndTime)
    const eventStartTime = toUnixSeconds(form.eventStartTime)
    const eventEndTime = toUnixSeconds(form.eventEndTime)

    if (!(saleStartTime < saleEndTime && saleEndTime <= eventStartTime && eventStartTime < eventEndTime)) {
      setValidationError('Use a valid timeline: saleStart < saleEnd <= eventStart < eventEnd.')
      return
    }

    const params = {
      name: form.name.trim(),
      venue: form.venue.trim(),
      ticketPrice: parseEther(form.ticketPrice),
      maxSupply: BigInt(form.maxSupply),
      saleStartTime,
      saleEndTime,
      eventStartTime,
      eventEndTime,
      cidUpcoming: form.cidUpcoming.trim(),
      cidLive: form.cidLive.trim(),
      cidAttended: form.cidAttended.trim(),
    }

    setSubmittedName(params.name)

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'createEvent',
      args: [params],
      value: parseEther(form.cashbackPool),
    })
  }

  return (
    <section className="panel">
      <h2>Create Event</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label className="field">
          <span className="label">Name</span>
          <input className="input" name="name" value={form.name} onChange={updateField} required />
        </label>

        <label className="field">
          <span className="label">Venue</span>
          <input className="input" name="venue" value={form.venue} onChange={updateField} required />
        </label>

        <label className="field">
          <span className="label">Ticket Price (ETH)</span>
          <input
            className="input"
            name="ticketPrice"
            type="number"
            min="0"
            step="0.0001"
            value={form.ticketPrice}
            onChange={updateField}
            required
          />
        </label>

        <label className="field">
          <span className="label">Max Supply</span>
          <input
            className="input"
            name="maxSupply"
            type="number"
            min="1"
            step="1"
            value={form.maxSupply}
            onChange={updateField}
            required
          />
        </label>

        <label className="field">
          <span className="label">Sale Start Time</span>
          <input
            className="input"
            name="saleStartTime"
            type="datetime-local"
            value={form.saleStartTime}
            onChange={updateField}
            required
          />
        </label>

        <label className="field">
          <span className="label">Sale End Time</span>
          <input
            className="input"
            name="saleEndTime"
            type="datetime-local"
            value={form.saleEndTime}
            onChange={updateField}
            required
          />
        </label>

        <label className="field">
          <span className="label">Event Start Time</span>
          <input
            className="input"
            name="eventStartTime"
            type="datetime-local"
            value={form.eventStartTime}
            onChange={updateField}
            required
          />
        </label>

        <label className="field">
          <span className="label">Event End Time</span>
          <input
            className="input"
            name="eventEndTime"
            type="datetime-local"
            value={form.eventEndTime}
            onChange={updateField}
            required
          />
        </label>

        <label className="field">
          <span className="label">CID Upcoming</span>
          <input className="input" name="cidUpcoming" value={form.cidUpcoming} onChange={updateField} required />
        </label>

        <label className="field">
          <span className="label">CID Live</span>
          <input className="input" name="cidLive" value={form.cidLive} onChange={updateField} required />
        </label>

        <label className="field">
          <span className="label">CID Attended</span>
          <input className="input" name="cidAttended" value={form.cidAttended} onChange={updateField} required />
        </label>

        <label className="field">
          <span className="label">Cashback Pool (ETH)</span>
          <input
            className="input"
            name="cashbackPool"
            type="number"
            min="0"
            step="0.0001"
            value={form.cashbackPool}
            onChange={updateField}
            required
          />
        </label>

        <button type="submit" className="wallet-button" disabled={!isConnected || isBusy}>
          {isPending ? 'Confirm in MetaMask...' : isConfirming ? 'Waiting for receipt...' : 'Create Event'}
        </button>
      </form>

      {!isConnected && <p className="muted-text">Connect MetaMask before creating an event.</p>}
      {timePreview && (
        <p className="muted-text">
          Unix seconds: {timePreview.saleStartTime.toString()} / {timePreview.saleEndTime.toString()} / {timePreview.eventStartTime.toString()} / {timePreview.eventEndTime.toString()}
        </p>
      )}
      {validationError && <p className="error-text">{validationError}</p>}
      {error && <p className="error-text">{error.shortMessage || error.message}</p>}
      {hash && <p className="muted-text">Transaction hash: {hash}</p>}
      {isSuccess && <p className="success-text">Event "{submittedName}" was created successfully.</p>}
    </section>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { parseEther } from 'viem'
import { useAccount, useWaitForTransactionReceipt, useWriteContract } from 'wagmi'
import { CONTRACT_ABI, CONTRACT_ADDRESS } from '../abi'

const PINATA_JWT = import.meta.env.VITE_PINATA_JWT ?? import.meta.env.PINATA_JWT

const initialForm = {
  name: '',
  venue: '',
  ticketPrice: '',
  maxSupply: '',
  saleStartTime: '',
  saleEndTime: '',
  eventStartTime: '',
  eventEndTime: '',
  cashbackPool: '',
}

function toUnixSeconds(value) {
  return BigInt(Math.floor(new Date(value).getTime() / 1000))
}

export default function CreateEventForm() {
  const [form, setForm] = useState(initialForm)
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [imageCID, setImageCID] = useState('')
  const [uploadLoading, setUploadLoading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [validationError, setValidationError] = useState('')
  const [submittedName, setSubmittedName] = useState('')
  const { isConnected } = useAccount()
  const { data: hash, error, isPending, writeContract } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash })

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

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

  async function uploadToIPFS(file) {
    if (!PINATA_JWT) {
      throw new Error('Pinata JWT is missing. Set VITE_PINATA_JWT in your frontend env.')
    }

    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PINATA_JWT}`,
      },
      body: formData,
    })

    const payload = await response.json()

    if (!response.ok) {
      throw new Error(payload?.error?.reason || payload?.message || 'Pinata upload failed.')
    }

    if (!payload?.IpfsHash) {
      throw new Error('Pinata upload succeeded, but no CID was returned.')
    }

    return payload.IpfsHash
  }

  async function handleImageChange(event) {
    const file = event.target.files?.[0]
    let nextPreviewUrl = ''

    if (previewUrl) URL.revokeObjectURL(previewUrl)

    setImageFile(file ?? null)
    setPreviewUrl('')
    setImageCID('')
    setUploadStatus('')
    setUploadError('')

    if (!file) return

    nextPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(nextPreviewUrl)

    setUploadLoading(true)
    setUploadStatus('Uploading image...')

    try {
      const cid = await uploadToIPFS(file)
      setImageCID(cid)
      setUploadStatus('Upload successful')
    } catch (uploadException) {
      setUploadError(uploadException.message)
      setUploadStatus('')
    } finally {
      setUploadLoading(false)
    }
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

    if (!imageCID) {
      setValidationError('Upload an event image to IPFS before creating the event.')
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
      cidUpcoming: imageCID,
      cidLive: imageCID,
      cidAttended: imageCID,
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
          <span className="label">Event Image</span>
          <input
            className="input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
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
      {imageFile && <p className="muted-text">Selected image: {imageFile.name}</p>}
      {!imageCID && previewUrl && (
        <img
          className="preview-image"
          src={previewUrl}
          alt="Selected event preview"
        />
      )}
      {uploadLoading && <p className="muted-text">Uploading image...</p>}
      {uploadStatus && !uploadLoading && <p className="success-text">{uploadStatus}</p>}
      {uploadError && <p className="error-text">{uploadError}</p>}
      {imageCID && (
        <img
          className="preview-image"
          src={`https://gateway.pinata.cloud/ipfs/${imageCID}`}
          alt="Uploaded event preview"
        />
      )}
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

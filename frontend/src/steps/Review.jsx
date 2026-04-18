import { useState } from 'react'
import { api } from '../api'

const VAT_RATE = 0.2

export default function Review({ locationData, wasteData, skipData, onBack, onSuccess }) {
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const net = skipData.price
  const vat = Math.round(net * VAT_RATE)
  const total = net + vat

  const pbLabels = {
    mixed_load: 'Mixed load',
    separate_collection: 'Separate collection',
    licensed_disposal: 'Licensed disposal site',
  }

  async function handleConfirm() {
    if (submitting || submitted) return
    setSubmitting(true)
    setError('')
    try {
      const data = await api.confirmBooking({
        postcode: locationData.postcode,
        addressId: locationData.addressId,
        addressManual: locationData.addressId ? null : locationData.addressLine,
        heavyWaste: wasteData.heavyWaste,
        plasterboard: wasteData.plasterboard,
        plasterboardOption: wasteData.plasterboardOption,
        skipSize: skipData.skipSize,
        price: total,
      })
      setSubmitted(true)
      onSuccess(data.bookingId)
    } catch (e) {
      setError(e.status === 409
        ? 'This booking has already been submitted.'
        : e.message || 'Booking failed. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <div className="card" data-testid="step-review">
      <h2>Review your booking</h2>

      <div data-testid="review-details">
        <div className="review-row">
          <span className="label">Address</span>
          <span className="value">{locationData.addressLine}</span>
        </div>
        <div className="review-row">
          <span className="label">Postcode</span>
          <span className="value">{locationData.postcode}</span>
        </div>
        <div className="review-row">
          <span className="label">Waste type</span>
          <span className="value" style={{ textTransform: 'capitalize' }}>
            {wasteData.wasteType.replace('_', ' ')}
            {wasteData.plasterboard && wasteData.plasterboardOption
              ? ` — ${pbLabels[wasteData.plasterboardOption]}`
              : ''}
          </span>
        </div>
        <div className="review-row">
          <span className="label">Skip size</span>
          <span className="value">{skipData.skipSize}</span>
        </div>
      </div>

      <div className="price-breakdown" data-testid="price-breakdown">
        <div className="price-line">
          <span>Skip hire ({skipData.skipSize})</span>
          <span>£{net}</span>
        </div>
        <div className="price-line">
          <span>VAT (20%)</span>
          <span>£{vat}</span>
        </div>
        <div className="price-total" data-testid="price-total">
          <span>Total</span>
          <span>£{total}</span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginTop: 16 }} data-testid="confirm-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="nav-row" style={{ marginTop: 20 }}>
        <button className="btn btn-secondary" data-testid="back-btn" onClick={onBack} disabled={submitting}>
          ← Back
        </button>
        <button
          className="btn btn-success"
          data-testid="confirm-btn"
          onClick={handleConfirm}
          disabled={submitting || submitted}
        >
          {submitting
            ? <><span className="spinner" />Confirming…</>
            : '✓ Confirm Booking'}
        </button>
      </div>
    </div>
  )
}

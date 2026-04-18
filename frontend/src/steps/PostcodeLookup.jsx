import { useState } from 'react'
import { api } from '../api'

const UK_RE = /^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$/i

export default function PostcodeLookup({ onNext }) {
  const [postcode, setPostcode] = useState('')
  const [postcodeError, setPostcodeError] = useState('')
  const [addresses, setAddresses] = useState(null)
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [manualEntry, setManualEntry] = useState(false)
  const [manualAddress, setManualAddress] = useState('')

  function validate(v) {
    if (!v.trim()) return 'Postcode is required'
    if (!UK_RE.test(v.trim())) return 'Enter a valid UK postcode (e.g. SW1A 1AA)'
    return ''
  }

  async function handleLookup() {
    const err = validate(postcode)
    if (err) { setPostcodeError(err); return }
    setPostcodeError('')
    setApiError('')
    setAddresses(null)
    setSelectedId('')
    setManualEntry(false)
    setLoading(true)
    try {
      const data = await api.lookupPostcode(postcode)
      setAddresses(data.addresses)
    } catch (e) {
      setApiError(e.message || 'Lookup failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') handleLookup()
  }

  function handleNext() {
    if (!manualEntry && !selectedId) return
    if (manualEntry && !manualAddress.trim()) return
    onNext({
      postcode: postcode.trim().toUpperCase(),
      addressId: manualEntry ? null : selectedId,
      addressLine: manualEntry
        ? manualAddress
        : addresses.find(a => a.id === selectedId)?.line1,
    })
  }

  const canProceed = manualEntry ? manualAddress.trim() : selectedId

  return (
    <div className="card" data-testid="step-postcode">
      <h2>Where do you need the skip?</h2>

      <div className="field">
        <label htmlFor="postcode-input">UK Postcode</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            id="postcode-input"
            data-testid="postcode-input"
            className={postcodeError ? 'error' : ''}
            value={postcode}
            onChange={e => setPostcode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. SW1A 1AA"
            maxLength={8}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            data-testid="lookup-btn"
            onClick={handleLookup}
            disabled={loading}
          >
            {loading ? <><span className="spinner" />Finding…</> : 'Find'}
          </button>
        </div>
        {postcodeError && <p className="field-error" data-testid="postcode-error">{postcodeError}</p>}
      </div>

      {loading && (
        <div className="loading-state" data-testid="loading">
          <span className="spinner dark" />
          <p>Looking up addresses…</p>
        </div>
      )}

      {apiError && (
        <div className="alert alert-error" data-testid="api-error">
          <span>⚠️</span>
          <div>
            <strong>Lookup failed</strong>
            <p>{apiError}</p>
            <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={handleLookup} data-testid="retry-btn">
              Retry
            </button>
          </div>
        </div>
      )}

      {addresses !== null && !loading && !apiError && (
        <>
          {addresses.length === 0 ? (
            <div className="alert alert-warning" data-testid="no-addresses">
              <span>📭</span>
              <div>
                <strong>No addresses found</strong>
                <p>We couldn't find addresses for this postcode. Enter manually below.</p>
              </div>
            </div>
          ) : (
            <>
              <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 8 }}>
                {addresses.length} address{addresses.length !== 1 ? 'es' : ''} found
              </p>
              <div className="address-list" data-testid="address-list">
                {addresses.map(a => (
                  <label
                    key={a.id}
                    className={`address-option ${selectedId === a.id ? 'selected' : ''}`}
                    data-testid={`address-option-${a.id}`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={a.id}
                      checked={selectedId === a.id}
                      onChange={() => { setSelectedId(a.id); setManualEntry(false) }}
                    />
                    <span>{a.line1}, {a.city}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          <div className="divider">or</div>

          <button
            className="btn btn-secondary btn-full"
            data-testid="manual-entry-btn"
            onClick={() => { setManualEntry(true); setSelectedId('') }}
          >
            Enter address manually
          </button>
        </>
      )}

      {manualEntry && (
        <div className="field" style={{ marginTop: 12 }}>
          <label htmlFor="manual-address">Address</label>
          <input
            id="manual-address"
            data-testid="manual-address-input"
            value={manualAddress}
            onChange={e => setManualAddress(e.target.value)}
            placeholder="e.g. 5 Oak Lane, London"
          />
        </div>
      )}

      {(addresses !== null || manualEntry) && (
        <div className="nav-row">
          <div />
          <button
            className="btn btn-primary"
            data-testid="next-btn"
            onClick={handleNext}
            disabled={!canProceed}
          >
            Next: Waste Type →
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { api } from '../api'

export default function SkipSelection({ locationData, wasteData, onNext, onBack }) {
  const [skips, setSkips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState('')

  async function fetchSkips() {
    setLoading(true)
    setError('')
    try {
      const data = await api.getSkips(locationData.postcode, wasteData.heavyWaste)
      setSkips(data.skips)
    } catch (e) {
      setError(e.message || 'Failed to load skip options.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchSkips() }, [])

  const selectedSkip = skips.find(s => s.size === selected)

  function handleSelect(skip) {
    if (!skip.disabled) setSelected(skip.size)
  }

  return (
    <div className="card" data-testid="step-skips">
      <h2>Choose your skip size</h2>

      {wasteData.heavyWaste && !loading && !error && (
        <div className="alert alert-info" data-testid="heavy-waste-notice">
          <span>ℹ️</span>
          <p>Some sizes are unavailable for heavy waste due to weight restrictions.</p>
        </div>
      )}

      {loading && (
        <div className="loading-state" data-testid="loading">
          <span className="spinner dark" />
          <p>Loading skip options…</p>
        </div>
      )}

      {error && (
        <div className="alert alert-error" data-testid="skip-error">
          <span>⚠️</span>
          <div>
            <strong>Couldn't load skips</strong>
            <p>{error}</p>
            <button className="btn btn-secondary" style={{ marginTop: 8 }} onClick={fetchSkips} data-testid="retry-btn">
              Retry
            </button>
          </div>
        </div>
      )}

      {!loading && !error && skips.length > 0 && (
        <div className="skip-grid" data-testid="skip-grid">
          {skips.map(s => (
            <div
              key={s.size}
              className={`skip-card ${s.disabled ? 'disabled' : ''} ${selected === s.size ? 'selected' : ''}`}
              data-testid={`skip-${s.size}`}
              data-disabled={s.disabled}
              onClick={() => handleSelect(s)}
              role="radio"
              aria-checked={selected === s.size}
              aria-disabled={s.disabled}
              tabIndex={s.disabled ? -1 : 0}
              onKeyDown={e => e.key === 'Enter' && handleSelect(s)}
            >
              {s.disabled && <span className="skip-badge">Unavailable</span>}
              <div className="skip-size">{s.size}</div>
              <div className="skip-price">£{s.price}</div>
            </div>
          ))}
        </div>
      )}

      <div className="nav-row">
        <button className="btn btn-secondary" data-testid="back-btn" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn btn-primary"
          data-testid="next-btn"
          onClick={() => onNext({ skipSize: selected, price: selectedSkip?.price })}
          disabled={!selected || loading}
        >
          Next: Review →
        </button>
      </div>
    </div>
  )
}

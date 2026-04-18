import { useState } from 'react'
import { api } from '../api'

const WASTE_TYPES = [
  { id: 'general', icon: '🗑️', label: 'General Waste', desc: 'Household & light commercial' },
  { id: 'heavy',   icon: '🪨', label: 'Heavy Waste',   desc: 'Soil, concrete, bricks, rubble' },
  { id: 'plasterboard', icon: '🧱', label: 'Plasterboard', desc: 'Drywall and gypsum board' },
]

const PB_OPTIONS = [
  {
    id: 'mixed_load',
    label: 'Mixed Load',
    desc: 'Plasterboard mixed with other waste. Higher disposal charge may apply.',
  },
  {
    id: 'separate_collection',
    label: 'Separate Collection',
    desc: 'Plasterboard collected separately for recycling. Recommended.',
  },
  {
    id: 'licensed_disposal',
    label: 'Licensed Disposal Site',
    desc: 'Taken directly to a licensed facility. Best for large quantities.',
  },
]

export default function WasteType({ locationData, onNext, onBack }) {
  const [selected, setSelected] = useState('')
  const [pbOption, setPbOption] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isPlasterboard = selected === 'plasterboard'
  const canProceed = selected && (!isPlasterboard || pbOption)

  async function handleNext() {
    if (!canProceed) return
    setLoading(true)
    setError('')
    try {
      await api.submitWasteTypes({
        heavyWaste: selected === 'heavy',
        plasterboard: isPlasterboard,
        plasterboardOption: isPlasterboard ? pbOption : null,
      })
      onNext({
        wasteType: selected,
        heavyWaste: selected === 'heavy',
        plasterboard: isPlasterboard,
        plasterboardOption: isPlasterboard ? pbOption : null,
      })
    } catch (e) {
      setError(e.message || 'Failed to save selection. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="card" data-testid="step-waste">
      <h2>What type of waste?</h2>

      {selected === 'heavy' && (
        <div className="alert alert-warning" data-testid="heavy-waste-warning">
          <span>⚠️</span>
          <p>Heavy waste restricts some skip sizes. You'll see available options next.</p>
        </div>
      )}

      <div className="waste-grid" data-testid="waste-type-grid">
        {WASTE_TYPES.map(t => (
          <div
            key={t.id}
            className={`waste-card ${selected === t.id ? 'selected' : ''}`}
            data-testid={`waste-${t.id}`}
            onClick={() => { setSelected(t.id); setPbOption('') }}
            role="radio"
            aria-checked={selected === t.id}
            tabIndex={0}
            onKeyDown={e => e.key === 'Enter' && setSelected(t.id)}
          >
            <div className="icon">{t.icon}</div>
            <div className="label">{t.label}</div>
            <div className="desc">{t.desc}</div>
          </div>
        ))}
      </div>

      {isPlasterboard && (
        <div data-testid="plasterboard-options">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: 10 }}>
            How will the plasterboard be handled?
          </h3>
          <div className="plasterboard-options">
            {PB_OPTIONS.map(opt => (
              <label
                key={opt.id}
                className={`pb-option ${pbOption === opt.id ? 'selected' : ''}`}
                data-testid={`pb-option-${opt.id}`}
              >
                <input
                  type="radio"
                  name="pb-option"
                  value={opt.id}
                  checked={pbOption === opt.id}
                  onChange={() => setPbOption(opt.id)}
                />
                <div className="pb-option-text">
                  <strong>{opt.label}</strong>
                  <p>{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-error" data-testid="waste-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      <div className="nav-row">
        <button className="btn btn-secondary" data-testid="back-btn" onClick={onBack}>
          ← Back
        </button>
        <button
          className="btn btn-primary"
          data-testid="next-btn"
          onClick={handleNext}
          disabled={!canProceed || loading}
        >
          {loading ? <><span className="spinner" />Saving…</> : 'Next: Choose Skip →'}
        </button>
      </div>
    </div>
  )
}

const STEPS = ['Postcode', 'Waste Type', 'Skip', 'Review']

export default function StepIndicator({ current }) {
  return (
    <div className="step-indicator" data-testid="step-indicator">
      {STEPS.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : ''
        return (
          <React.Fragment key={label}>
            {i > 0 && <div className={`step-connector ${i <= current ? 'done' : ''}`} />}
            <div className="step-item">
              <div className={`step-circle ${state}`} data-testid={`step-${i}`}>
                {i < current ? '✓' : i + 1}
              </div>
              <span className={`step-label ${state}`}>{label}</span>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

import React from 'react'

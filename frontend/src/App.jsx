import { useState } from 'react'
import StepIndicator from './components/StepIndicator'
import PostcodeLookup from './steps/PostcodeLookup'
import WasteType from './steps/WasteType'
import SkipSelection from './steps/SkipSelection'
import Review from './steps/Review'

export default function App() {
  const [step, setStep] = useState(0)
  const [locationData, setLocationData] = useState(null)
  const [wasteData, setWasteData] = useState(null)
  const [skipData, setSkipData] = useState(null)
  const [bookingId, setBookingId] = useState(null)

  function handleLocationNext(data) { setLocationData(data); setStep(1) }
  function handleWasteNext(data)    { setWasteData(data);    setStep(2) }
  function handleSkipNext(data)     { setSkipData(data);     setStep(3) }
  function handleSuccess(id)        { setBookingId(id);      setStep(4) }

  function restart() {
    setStep(0)
    setLocationData(null)
    setWasteData(null)
    setSkipData(null)
    setBookingId(null)
  }

  return (
    <div className="app">
      <div className="app-header">
        <h1>Skip Hire Booking</h1>
        <p>Fast, local skip hire — book in minutes</p>
      </div>

      {step < 4 && <StepIndicator current={step} />}

      {step === 0 && (
        <PostcodeLookup onNext={handleLocationNext} />
      )}
      {step === 1 && (
        <WasteType
          locationData={locationData}
          onNext={handleWasteNext}
          onBack={() => setStep(0)}
        />
      )}
      {step === 2 && (
        <SkipSelection
          locationData={locationData}
          wasteData={wasteData}
          onNext={handleSkipNext}
          onBack={() => setStep(1)}
        />
      )}
      {step === 3 && (
        <Review
          locationData={locationData}
          wasteData={wasteData}
          skipData={skipData}
          onBack={() => setStep(2)}
          onSuccess={handleSuccess}
        />
      )}
      {step === 4 && (
        <div className="card success-view" data-testid="success-view">
          <div className="success-icon">🎉</div>
          <h2>Booking Confirmed!</h2>
          <p>Your skip has been booked. Keep this reference number safe.</p>
          <div className="booking-id" data-testid="booking-id">{bookingId}</div>
          <p style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 20 }}>
            You'll receive a confirmation email shortly.
          </p>
          <button className="btn btn-secondary" onClick={restart} data-testid="restart-btn">
            Make another booking
          </button>
        </div>
      )}
    </div>
  )
}

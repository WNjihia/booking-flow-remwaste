const BASE = '/api'

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.detail || 'Request failed'), { status: res.status })
  return data
}

async function get(path, params = {}) {
  const qs = new URLSearchParams(params).toString()
  const url = `${BASE}${path}${qs ? '?' + qs : ''}`
  const res = await fetch(url)
  const data = await res.json()
  if (!res.ok) throw Object.assign(new Error(data.detail || 'Request failed'), { status: res.status })
  return data
}

export const api = {
  lookupPostcode: (postcode) => post('/postcode/lookup', { postcode }),
  submitWasteTypes: (payload) => post('/waste-types', payload),
  getSkips: (postcode, heavyWaste) => get('/skips', { postcode, heavyWaste }),
  confirmBooking: (payload) => post('/booking/confirm', payload),
}

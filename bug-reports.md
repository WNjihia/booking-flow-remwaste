# Bug Reports — Booking Flow

---

## BUG-001 — Plasterboard option persists after waste type is changed and re-selected

**Severity:** High
**Priority:** High
**Environment:** Chrome 124, macOS 14 / local dev (localhost:3000)
**Component:** Step 2 — Waste Type

### Steps to Reproduce
1. Navigate to Step 2 (Waste Type)
2. Select **Plasterboard**
3. Select **Mixed Load** as the handling option
4. Click **General Waste** — plasterboard options disappear as expected
5. Click **Plasterboard** again

### Actual Result
The **Mixed Load** radio button is pre-selected from the previous interaction. The Next button is immediately enabled without the user consciously re-confirming their handling choice.

### Expected Result
Switching away from Plasterboard and returning should reset the handling option to unselected. The user should be required to actively choose again.

### Why It Matters
This is a branching state transition bug. A user who accidentally clicks General Waste and then returns to Plasterboard may proceed with a stale selection they didn't intend, potentially affecting the booking and disposal logistics.

### Evidence
Reproducible 100% of the time following the steps above. The `pbOption` state in `WasteType.jsx` is only cleared when `setSelected` is called with a non-plasterboard type — but it is not cleared if the user returns to plasterboard after that.

### Fix
In the `onClick` handler for each waste card, always call `setPbOption('')` when the new selection differs from the current one.

---

## BUG-002 — VAT calculation truncates instead of rounding on odd-penny prices

**Severity:** Medium
**Priority:** Medium
**Environment:** Chrome 124, macOS 14 / local dev (localhost:3000)
**Component:** Step 4 — Review (price breakdown)

### Steps to Reproduce
1. Complete Steps 1–3 selecting any skip whose price × 1.2 produces a non-integer (e.g. a hypothetical £85 skip → VAT = £17, total = £102 — fine. But £83 → VAT = £16.6, truncates to £16, total = £99 instead of £99.60)
2. Observe the VAT line and total in the price breakdown

### Actual Result
`Math.round(net * 0.2)` rounds to the nearest pound, which means the displayed total can be £0.40–£0.49 off the true value depending on the skip price.

### Expected Result
The price breakdown should display the correct VAT amount. Either display pence (e.g. £16.60) or consistently state that prices are shown rounded to the nearest pound.

### Why It Matters
Displaying an incorrect total on a booking confirmation screen creates a trust and compliance risk — customers may dispute charges that differ from what was shown.

### Evidence
Current skip prices are all multiples of £10, so VAT is always a whole number. The bug is latent and will surface if skip prices are ever updated to non-round figures. The calculation in `Review.jsx` line: `const vat = Math.round(net * VAT_RATE)` does not account for pence.

### Fix
Either use `toFixed(2)` for display and store pence-accurate values, or document that all prices are VAT-inclusive and rounded to the nearest pound by policy.

---

## BUG-003 — Lookup button can be triggered repeatedly during a pending request

**Severity:** Low
**Priority:** Medium
**Environment:** Chrome 124, macOS 14 / local dev (localhost:3000)
**Component:** Step 1 — Postcode Lookup

### Steps to Reproduce
1. Enter postcode `M1 1AE` (which has a 3-second simulated latency)
2. Click **Find**
3. While the spinner is showing, click **Find** again (or press Enter in the input)

### Actual Result
A second API call fires before the first has resolved. If both resolve, the address list may flicker or render twice. The `loading` state is set to `false` by whichever call finishes last, which may not be the most recent one.

### Expected Result
The Find button and Enter keypress should be disabled/ignored while a lookup is in progress. Only one in-flight request should be permitted at a time.

### Why It Matters
On slow connections or with the latency fixture, users can trigger duplicate requests. In production this could cause race conditions where an older response overwrites a newer one, showing the wrong address list.

### Evidence
The Find button sets `loading: true` and disables itself, but the `onKeyDown` handler on the input still fires `handleLookup()` regardless of loading state. Reproducible by pressing Enter rapidly during the M1 1AE lookup.

### Fix
Add a `disabled={loading}` check inside `handleKeyDown`, or gate the entire `handleLookup` function with an early return if `loading` is true.

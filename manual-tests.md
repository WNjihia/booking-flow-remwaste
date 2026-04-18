# Manual Test Cases — Booking Flow

**Total:** 35 cases | **Negative:** 10 | **Edge:** 6 | **API Failure:** 4 | **State Transition:** 4

---

## Step 1 — Postcode Lookup

| TC | Title | Type | Preconditions | Steps | Expected Result |
|----|-------|------|---------------|-------|-----------------|
| TC-01 | Valid postcode returns 12+ addresses | Positive | App loaded | Enter `SW1A 1AA`, click Find | 12 addresses displayed in list |
| TC-02 | Valid postcode returns empty state | Positive | App loaded | Enter `EC1A 1BB`, click Find | "No addresses found" message shown |
| TC-03 | Select address from list enables Next | Positive | TC-01 complete | Click any address in list | Address highlighted, Next button enabled |
| TC-04 | Manual entry bypasses address list | Positive | TC-02 complete | Click "Enter address manually", type address | Manual input accepted, Next enabled |
| TC-05 | Empty postcode shows inline error | Negative | App loaded | Click Find with empty input | "Postcode is required" error shown, no API call made |
| TC-06 | Invalid format shows inline error | Negative | App loaded | Enter `HELLO`, click Find | "valid UK postcode" error shown |
| TC-07 | Partial postcode rejected | Negative | App loaded | Enter `SW1A`, click Find | Format validation error shown |
| TC-08 | Postcode with lowercase accepted | Edge | App loaded | Enter `sw1a 1aa`, click Find | Request succeeds; postcode uppercased in UI |
| TC-09 | Postcode without space accepted | Edge | App loaded | Enter `SW1A1AA`, click Find | Request succeeds; 12 addresses returned |
| TC-10 | Next disabled until address chosen | State Transition | Addresses loaded | Observe Next button before selecting | Next button is disabled |
| TC-11 | Re-lookup clears previous selection | State Transition | Address selected from SW1A 1AA | Change postcode to `EC1A 1BB`, click Find | Previous selection cleared; empty state shown |
| TC-12 | Simulated latency shows loading state | Edge | App loaded | Enter `M1 1AE`, click Find | Loading spinner visible for ~3 seconds before addresses appear |

---

## Step 2 — Waste Type

| TC | Title | Type | Preconditions | Steps | Expected Result |
|----|-------|------|---------------|-------|-----------------|
| TC-13 | General waste selection proceeds | Positive | Step 1 complete | Select General Waste, click Next | Proceeds to Skip Selection, no restrictions |
| TC-14 | Heavy waste shows warning banner | Positive | Step 1 complete | Select Heavy Waste | Warning banner appears immediately |
| TC-15 | Plasterboard reveals branching options | Positive | Step 1 complete | Select Plasterboard | Three handling options appear below |
| TC-16 | Plasterboard next disabled without option | Negative | Plasterboard selected | Click Next without choosing handling option | Next remains disabled; no API call made |
| TC-17 | Switching waste type clears plasterboard option | State Transition | Plasterboard + Mixed Load selected | Click General Waste | Plasterboard options hidden; selection cleared |
| TC-18 | Switching back to plasterboard requires re-selection | State Transition | TC-17 complete | Click Plasterboard again | Options re-shown but none pre-selected; Next still disabled |
| TC-19 | All three plasterboard options selectable | Positive | Plasterboard selected | Select each option in turn | Each option highlights correctly |
| TC-20 | No waste type selected blocks Next | Negative | Step 1 complete | Click Next without selecting any type | Next remains disabled |

---

## Step 3 — Skip Selection

| TC | Title | Type | Preconditions | Steps | Expected Result |
|----|-------|------|---------------|-------|-----------------|
| TC-21 | General waste shows all 8 skips enabled | Positive | General waste selected | Reach Skip step | 8 skips visible, none disabled |
| TC-22 | Heavy waste disables 8-yard skip | Positive | Heavy waste selected | Reach Skip step | 8-yard card shows "Unavailable" badge, not clickable |
| TC-23 | Heavy waste disables 10-yard skip | Positive | Heavy waste selected | Reach Skip step | 10-yard card shows "Unavailable" badge, not clickable |
| TC-24 | Disabled skip cannot be selected | Negative | Heavy waste, skip step | Click 8-yard skip | No selection made; Next remains disabled |
| TC-25 | Disabled skips remain visible | Edge | Heavy waste, skip step | Observe skip grid | 8-yard and 10-yard visible but greyed out |
| TC-26 | Selecting enabled skip activates Next | Positive | Skip step loaded | Click 4-yard | 4-yard highlighted; Next enabled |
| TC-27 | Skip loading error shows retry | API Failure | Network/server error on `/api/skips` | Simulate 500 on skips endpoint | Error message and Retry button shown |
| TC-28 | Retry on skip error reloads skips | API Failure | TC-27 complete | Click Retry | Skip grid reloads successfully |

---

## Step 4 — Review & Confirm

| TC | Title | Type | Preconditions | Steps | Expected Result |
|----|-------|------|---------------|-------|-----------------|
| TC-29 | Review shows all booking details | Positive | Steps 1–3 complete | Reach review step | Address, postcode, waste type, skip size all displayed |
| TC-30 | Price breakdown shows net + VAT + total | Positive | Steps 1–3 complete | Observe price breakdown | Net price, 20% VAT, and total shown separately |
| TC-31 | Confirm button submits booking | Positive | Review step loaded | Click Confirm Booking | Success view with booking ID (BK-XXXXX format) |
| TC-32 | Confirm button disabled after click | Negative | Review step loaded | Click Confirm Booking | Button immediately disabled; cannot click again |
| TC-33 | Double submit returns 409 error | API Failure | Same booking already confirmed | Submit identical booking again | "Already submitted" error shown; no duplicate booking |
| TC-34 | API failure on confirm shows error | API Failure | Simulate 500 on `/api/booking/confirm` | Click Confirm | Error message shown; button re-enabled for retry |
| TC-35 | Back from review preserves skip selection | Edge | Review step loaded | Click Back | Skip step shown with previous selection intact |

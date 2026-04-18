from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import asyncio
import re

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- state ---
bs1_call_count = 0
confirmed_bookings: set[str] = set()

# --- data ---
SW1A_ADDRESSES = [
    {"id": "addr_1",  "line1": "10 Downing Street",       "city": "London"},
    {"id": "addr_2",  "line1": "12 Downing Street",       "city": "London"},
    {"id": "addr_3",  "line1": "1 Parliament Square",     "city": "London"},
    {"id": "addr_4",  "line1": "2 Parliament Square",     "city": "London"},
    {"id": "addr_5",  "line1": "5 Horse Guards Road",     "city": "London"},
    {"id": "addr_6",  "line1": "7 Horse Guards Road",     "city": "London"},
    {"id": "addr_7",  "line1": "9 Whitehall",             "city": "London"},
    {"id": "addr_8",  "line1": "11 Whitehall",            "city": "London"},
    {"id": "addr_9",  "line1": "3 Great George Street",   "city": "London"},
    {"id": "addr_10", "line1": "4 Great George Street",   "city": "London"},
    {"id": "addr_11", "line1": "6 King Charles Street",   "city": "London"},
    {"id": "addr_12", "line1": "8 King Charles Street",   "city": "London"},
]

M1_ADDRESSES = [
    {"id": "m1_1", "line1": "1 Piccadilly Gardens",  "city": "Manchester"},
    {"id": "m1_2", "line1": "2 Market Street",        "city": "Manchester"},
    {"id": "m1_3", "line1": "3 Mosley Street",        "city": "Manchester"},
]

BS1_ADDRESSES = [
    {"id": "bs1_1", "line1": "1 Broad Quay",    "city": "Bristol"},
    {"id": "bs1_2", "line1": "2 College Green", "city": "Bristol"},
    {"id": "bs1_3", "line1": "3 Queen Square",  "city": "Bristol"},
]

SKIPS = [
    {"size": "2-yard",  "price": 80,  "heavyDisabled": False},
    {"size": "4-yard",  "price": 120, "heavyDisabled": False},
    {"size": "6-yard",  "price": 160, "heavyDisabled": False},
    {"size": "8-yard",  "price": 200, "heavyDisabled": True},
    {"size": "10-yard", "price": 230, "heavyDisabled": True},
    {"size": "12-yard", "price": 260, "heavyDisabled": False},
    {"size": "14-yard", "price": 290, "heavyDisabled": False},
    {"size": "16-yard", "price": 320, "heavyDisabled": False},
]

UK_POSTCODE_RE = re.compile(
    r"^[A-Z]{1,2}[0-9][0-9A-Z]?\s*[0-9][A-Z]{2}$", re.IGNORECASE
)

def normalise(postcode: str) -> str:
    return postcode.replace(" ", "").upper()

def is_valid_uk_postcode(postcode: str) -> bool:
    return bool(UK_POSTCODE_RE.match(postcode.strip()))

# --- models ---
class PostcodeLookupRequest(BaseModel):
    postcode: str

class WasteTypesRequest(BaseModel):
    heavyWaste: bool
    plasterboard: bool
    plasterboardOption: Optional[str] = None

class BookingConfirmRequest(BaseModel):
    postcode: str
    addressId: Optional[str] = None
    addressManual: Optional[str] = None
    heavyWaste: bool
    plasterboard: bool
    plasterboardOption: Optional[str] = None
    skipSize: str
    price: int

# --- endpoints ---
@app.post("/api/postcode/lookup")
async def postcode_lookup(body: PostcodeLookupRequest):
    global bs1_call_count

    raw = body.postcode.strip()
    if not is_valid_uk_postcode(raw):
        raise HTTPException(status_code=422, detail="Invalid UK postcode format")

    code = normalise(raw)

    if code == "SW1A1AA":
        return {"postcode": raw.upper(), "addresses": SW1A_ADDRESSES}

    if code == "EC1A1BB":
        return {"postcode": raw.upper(), "addresses": []}

    if code == "M11AE":
        await asyncio.sleep(3)
        return {"postcode": raw.upper(), "addresses": M1_ADDRESSES}

    if code == "BS14DJ":
        bs1_call_count += 1
        if bs1_call_count % 2 == 1:   # odd calls fail
            raise HTTPException(status_code=500, detail="Internal server error — please retry")
        return {"postcode": raw.upper(), "addresses": BS1_ADDRESSES}

    # generic fallback
    return {
        "postcode": raw.upper(),
        "addresses": [
            {"id": "gen_1", "line1": "1 Example Road", "city": "Anytown"},
            {"id": "gen_2", "line1": "2 Example Road", "city": "Anytown"},
        ],
    }

@app.post("/api/waste-types")
async def waste_types(body: WasteTypesRequest):
    if body.plasterboard and body.plasterboardOption not in (
        "mixed_load", "separate_collection", "licensed_disposal"
    ):
        raise HTTPException(status_code=422, detail="Invalid plasterboardOption")
    return {"ok": True}

@app.get("/api/skips")
async def get_skips(
    postcode: str = Query(...),
    heavyWaste: bool = Query(False),
):
    result = []
    for s in SKIPS:
        disabled = s["heavyDisabled"] and heavyWaste
        result.append({"size": s["size"], "price": s["price"], "disabled": disabled})
    return {"skips": result}

@app.post("/api/booking/confirm")
async def confirm_booking(body: BookingConfirmRequest):
    # dedup key — postcode + skip + price
    key = f"{normalise(body.postcode)}:{body.skipSize}:{body.price}"
    if key in confirmed_bookings:
        raise HTTPException(status_code=409, detail="Booking already submitted")
    confirmed_bookings.add(key)

    import random, string
    suffix = "".join(random.choices(string.digits, k=5))
    return {"status": "success", "bookingId": f"BK-{suffix}"}

@app.delete("/api/booking/reset")
async def reset_bookings():
    """Test-only endpoint to clear confirmed bookings between runs."""
    global bs1_call_count
    confirmed_bookings.clear()
    bs1_call_count = 0
    return {"ok": True}

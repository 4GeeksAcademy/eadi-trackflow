from datetime import UTC, datetime
from enum import Enum
from pathlib import Path
from typing import Literal

from fastapi import (
    FastAPI,
    File,
    HTTPException,
    Query,
    UploadFile,
)
from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator
from tinydb import Query as TinyQuery
from tinydb import TinyDB

from fastapi.responses import (
    Response,
)


from packages.incidents_analysis import (
    analyze_csv_text,
    summary_to_csv,
)


app = FastAPI(
    title=(
        "Trackflow Incidents API"
    ),
    version="1.0.0",
)


LAST_ANALYSIS = None
SUPPLIERS_DB_PATH = Path(__file__).with_name("suppliers_db.json")
SUPPLIERS_TABLE = "suppliers_context3"

VALID_CATEGORIES = [
    "carrier_last_mile",
    "carrier_international",
    "warehouse_supplies",
    "packaging_materials",
    "reverse_logistics",
    "fleet_maintenance",
    "it_and_wms_software",
    "cleaning_and_facilities",
]


class SupplierStatus(str, Enum):
    active = "active"
    suspended = "suspended"


class SupplierCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2)
    country: Literal["USA", "Spain"]
    categories: list[str] = Field(min_length=1)
    rate_per_shipment: float = Field(gt=0)
    currency: Literal["USD", "EUR"]
    status: SupplierStatus
    service_zone: str | None = None
    contact_email: str | None = None
    notes: str | None = None

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        cleaned = value.strip()

        if len(cleaned) < 2:
            raise ValueError("name must contain at least 2 characters")

        return cleaned

    @field_validator("categories")
    @classmethod
    def validate_categories(cls, values: list[str]) -> list[str]:
        cleaned = [item.strip() for item in values if item.strip()]

        if not cleaned:
            raise ValueError("categories cannot be empty")

        invalid = [item for item in cleaned if item not in VALID_CATEGORIES]

        if invalid:
            raise ValueError(
                "invalid categories: " + ", ".join(sorted(set(invalid)))
            )

        return list(dict.fromkeys(cleaned))

    @field_validator("service_zone", "contact_email", "notes")
    @classmethod
    def normalize_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None

        cleaned = value.strip()

        return cleaned or None

    @model_validator(mode="after")
    def validate_currency_by_country(self):
        valid_currency = "USD" if self.country == "USA" else "EUR"

        if self.currency != valid_currency:
            raise ValueError(
                "currency must match country: USD for USA and EUR for Spain"
            )

        return self


class Supplier(SupplierCreate):
    updated_at: str


class SupplierResponse(Supplier):
    id: int


class SupplierRateUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    rate_per_shipment: float = Field(gt=0)


class SupplierStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: SupplierStatus



def _now_utc_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat()


def _suppliers_table():
    db = TinyDB(SUPPLIERS_DB_PATH)
    return db, db.table(SUPPLIERS_TABLE)


def _serialize_supplier(item) -> SupplierResponse:
    payload = dict(item)
    payload["id"] = item.doc_id

    return SupplierResponse(**payload)


@app.get("/")
def root():

    return {
        "message":
            (
                "Trackflow Incidents "
                "API is running"
            )
    }


@app.post("/suppliers", response_model=SupplierResponse, status_code=201)
def create_supplier(payload: SupplierCreate):

    db, table = _suppliers_table()

    try:
        supplier = Supplier(**payload.model_dump(), updated_at=_now_utc_iso())

        new_id = table.insert(supplier.model_dump())

        return SupplierResponse(id=new_id, **supplier.model_dump())

    finally:
        db.close()


@app.get("/suppliers", response_model=list[SupplierResponse])
def list_suppliers(
    country: Literal["USA", "Spain"] | None = Query(default=None),
    category: str | None = Query(default=None),
):

    if category is not None and category not in VALID_CATEGORIES:
        raise HTTPException(
            status_code=422,
            detail="category must be one of VALID_CATEGORIES",
        )

    db, table = _suppliers_table()

    try:
        query = TinyQuery()
        items = table.all()

        if country is not None:
            items = table.search(query.country == country)

        if category is not None:
            items = [item for item in items if category in item.get("categories", [])]

        return [_serialize_supplier(item) for item in items]

    finally:
        db.close()


@app.get("/suppliers/{supplier_id}", response_model=SupplierResponse)
def get_supplier(supplier_id: int):

    db, table = _suppliers_table()

    try:
        item = table.get(doc_id=supplier_id)

        if item is None:
            raise HTTPException(status_code=404, detail="Supplier not found")

        return _serialize_supplier(item)

    finally:
        db.close()


@app.patch("/suppliers/{supplier_id}/rate", response_model=SupplierResponse)
def update_supplier_rate(supplier_id: int, payload: SupplierRateUpdate):

    db, table = _suppliers_table()

    try:
        current = table.get(doc_id=supplier_id)

        if current is None:
            raise HTTPException(status_code=404, detail="Supplier not found")

        table.update(
            {
                "rate_per_shipment": payload.rate_per_shipment,
                "updated_at": _now_utc_iso(),
            },
            doc_ids=[supplier_id],
        )

        updated = table.get(doc_id=supplier_id)

        return _serialize_supplier(updated)

    finally:
        db.close()


@app.patch("/suppliers/{supplier_id}/status", response_model=SupplierResponse)
def update_supplier_status(supplier_id: int, payload: SupplierStatusUpdate):

    db, table = _suppliers_table()

    try:
        current = table.get(doc_id=supplier_id)

        if current is None:
            raise HTTPException(status_code=404, detail="Supplier not found")

        table.update({"status": payload.status.value}, doc_ids=[supplier_id])

        updated = table.get(doc_id=supplier_id)

        return _serialize_supplier(updated)

    finally:
        db.close()


@app.delete("/suppliers/{supplier_id}")
def delete_supplier(supplier_id: int):

    db, table = _suppliers_table()

    try:
        current = table.get(doc_id=supplier_id)

        if current is None:
            raise HTTPException(status_code=404, detail="Supplier not found")

        table.remove(doc_ids=[supplier_id])

        return {"deleted": True}

    finally:
        db.close()


@app.post(
    "/api/incidents/analyze"
)
async def analyze_incidents(
    file: UploadFile = File(...)
):

    global LAST_ANALYSIS


    if not file.filename:

        raise HTTPException(
            status_code=400,
            detail=(
                "El fichero "
                "no tiene nombre."
            ),
        )


    if not (
        file.filename
        .lower()
        .endswith(".csv")
    ):

        raise HTTPException(
            status_code=415,
            detail=(
                "El fichero debe "
                "tener extensión .csv."
            ),
        )


    content = await file.read()


    if not content:

        raise HTTPException(
            status_code=400,
            detail=(
                "El fichero está vacío."
            ),
        )


    try:

        text = content.decode(
            "utf-8-sig"
        )


    except UnicodeDecodeError as error:

        raise HTTPException(
            status_code=400,
            detail=(
                "El fichero debe "
                "utilizar codificación "
                "UTF-8."
            ),
        ) from error


    try:

        result = analyze_csv_text(
            text=text,
            source_file=file.filename,
        )


    except ValueError as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


    LAST_ANALYSIS = result


    return result


@app.get(
    "/api/incidents/results/export"
)
def export_results():

    if LAST_ANALYSIS is None:

        raise HTTPException(
            status_code=404,
            detail=(
                "Todavía no existe "
                "ningún análisis "
                "para exportar."
            ),
        )


    csv_content = (
        summary_to_csv(
            LAST_ANALYSIS
        )
    )


    return Response(
        content=csv_content,

        media_type="text/csv",

        headers={
            "Content-Disposition":
                (
                    "attachment; "
                    'filename="results.csv"'
                )
        },
    )

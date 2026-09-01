/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useCallback } from "react";
import { authorizedFetch } from "@/services/auth";

type SupplierStatus = "active" | "suspended";
type SupplierCountry = "USA" | "Spain";
type SupplierCurrency = "USD" | "EUR";

type Supplier = {
  id: number;
  name: string;
  country: SupplierCountry;
  categories: string[];
  rate_per_shipment: number;
  currency: SupplierCurrency;
  updated_at: string;
  status: SupplierStatus;
  service_zone?: string | null;
  contact_email?: string | null;
  notes?: string | null;
};

type SupplierCreatePayload = {
  name: string;
  country: SupplierCountry;
  categories: string[];
  rate_per_shipment: number;
  currency: SupplierCurrency;
  status: SupplierStatus;
  service_zone?: string;
  contact_email?: string;
  notes?: string;
};

const VALID_CATEGORIES = [
  "carrier_last_mile",
  "carrier_international",
  "warehouse_supplies",
  "packaging_materials",
  "reverse_logistics",
  "fleet_maintenance",
  "it_and_wms_software",
  "cleaning_and_facilities",
] as const;

function currencyForCountry(country: SupplierCountry): SupplierCurrency {
  return country === "USA" ? "USD" : "EUR";
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");

  const [name, setName] = useState("");
  const [country, setCountry] = useState<SupplierCountry>("USA");
  const [categories, setCategories] = useState<string[]>([]);
  const [ratePerShipment, setRatePerShipment] = useState("1");
  const [serviceZone, setServiceZone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [rowRateDrafts, setRowRateDrafts] = useState<Record<number, string>>({});
  const [rowPending, setRowPending] = useState<Record<number, boolean>>({});

  const categorySet = useMemo(() => new Set(categories), [categories]);

  const fetchSuppliers = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (countryFilter) {
        params.set("country", countryFilter);
      }

      if (categoryFilter) {
        params.set("category", categoryFilter);
      }

      const query = params.toString();
      const endpoint = query ? `/backend/suppliers?${query}` : "/backend/suppliers";

      const response = await authorizedFetch(endpoint);
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail ?? "No fue posible cargar proveedores.");
      }

      const parsed = data as Supplier[];

      setSuppliers(parsed);
      setRowRateDrafts(
        Object.fromEntries(
          parsed.map((supplier) => [supplier.id, String(supplier.rate_per_shipment)]),
        ),
      );
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setLoading(false);
    }
  }, [countryFilter, categoryFilter]);

  useEffect(() => {
    void fetchSuppliers();
  }, [fetchSuppliers]);

  function toggleCategory(value: string): void {
    setCategories((current) => {
      if (current.includes(value)) {
        return current.filter((item) => item !== value);
      }

      return [...current, value];
    });
  }

  function validateCreateForm(): string {
    if (name.trim().length < 2) {
      return "El nombre debe tener al menos 2 caracteres.";
    }

    if (categories.length === 0) {
      return "Seleccioná al menos una categoría.";
    }

    const numericRate = Number(ratePerShipment);

    if (!Number.isFinite(numericRate) || numericRate <= 0) {
      return "rate_per_shipment debe ser mayor que 0.";
    }

    return "";
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const validationError = validateCreateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload: SupplierCreatePayload = {
        name: name.trim(),
        country,
        categories,
        rate_per_shipment: Number(ratePerShipment),
        currency: currencyForCountry(country),
        status: "active",
      };

      if (serviceZone.trim()) {
        payload.service_zone = serviceZone.trim();
      }

      if (contactEmail.trim()) {
        payload.contact_email = contactEmail.trim();
      }

      if (notes.trim()) {
        payload.notes = notes.trim();
      }

      const response = await authorizedFetch("/backend/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail ?? "No fue posible crear proveedor.");
      }

      setName("");
      setCountry("USA");
      setCategories([]);
      setRatePerShipment("1");
      setServiceZone("");
      setContactEmail("");
      setNotes("");

      await fetchSuppliers();
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRateUpdate(supplier: Supplier): Promise<void> {
    const draft = Number(rowRateDrafts[supplier.id]);

    if (!Number.isFinite(draft) || draft <= 0) {
      setError("rate_per_shipment debe ser mayor que 0.");
      return;
    }

    setError("");
    setRowPending((current) => ({ ...current, [supplier.id]: true }));

    try {
      const response = await authorizedFetch(`/backend/suppliers/${supplier.id}/rate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rate_per_shipment: draft }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail ?? "No fue posible actualizar la tarifa.");
      }

      const updated = data as Supplier;

      setSuppliers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setRowPending((current) => ({ ...current, [supplier.id]: false }));
    }
  }

  async function handleStatusToggle(supplier: Supplier): Promise<void> {
    const nextStatus: SupplierStatus =
      supplier.status === "active" ? "suspended" : "active";

    setError("");
    setRowPending((current) => ({ ...current, [supplier.id]: true }));

    try {
      const response = await authorizedFetch(`/backend/suppliers/${supplier.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.detail ?? "No fue posible actualizar el estado.");
      }

      const updated = data as Supplier;

      setSuppliers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("Ocurrió un error inesperado.");
      }
    } finally {
      setRowPending((current) => ({ ...current, [supplier.id]: false }));
    }
  }

  return (
    <main className="container">
      <header className="pageHeader">
        <span className="eyebrow">OPERACIONES</span>
        <h1>Directorio de proveedores</h1>
        <p>Registro centralizado de proveedores de USA y Spain para TrackFlow.</p>
      </header>

      <section className="card">
        <h2>Filtros</h2>

        <div className="supplierFilters">
          <label>
            country
            <select
              value={countryFilter}
              onChange={(event) => setCountryFilter(event.target.value)}
            >
              <option value="">Todos</option>
              <option value="USA">USA</option>
              <option value="Spain">Spain</option>
            </select>
          </label>

          <label>
            category
            <select
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Todas</option>
              {VALID_CATEGORIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section className="card">
        <h2>Alta de proveedor</h2>

        <form className="supplierForm" onSubmit={handleCreate}>
          <label>
            name
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={2}
              required
            />
          </label>

          <label>
            country
            <select
              value={country}
              onChange={(event) =>
                setCountry(event.target.value as SupplierCountry)
              }
            >
              <option value="USA">USA</option>
              <option value="Spain">Spain</option>
            </select>
          </label>

          <label>
            currency
            <input value={currencyForCountry(country)} disabled readOnly />
          </label>

          <label>
            rate_per_shipment
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={ratePerShipment}
              onChange={(event) => setRatePerShipment(event.target.value)}
              required
            />
          </label>

          <label>
            service_zone
            <input
              value={serviceZone}
              onChange={(event) => setServiceZone(event.target.value)}
            />
          </label>

          <label>
            contact_email
            <input
              type="email"
              value={contactEmail}
              onChange={(event) => setContactEmail(event.target.value)}
            />
          </label>

          <label className="fullWidth">
            notes
            <input
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          <fieldset className="categoriesFieldset fullWidth">
            <legend>categories</legend>

            <div className="categoriesGrid">
              {VALID_CATEGORIES.map((category) => (
                <label key={category} className="checkboxLabel">
                  <input
                    type="checkbox"
                    checked={categorySet.has(category)}
                    onChange={() => toggleCategory(category)}
                  />
                  <span>{category}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <button type="submit" disabled={submitting}>
            {submitting ? "Guardando..." : "Crear proveedor"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}
      </section>

      <section className="card">
        <h2>Proveedores</h2>

        {loading ? (
          <p>Cargando proveedores...</p>
        ) : suppliers.length === 0 ? (
          <p>No hay proveedores para los filtros seleccionados.</p>
        ) : (
          <div className="suppliersTableWrap">
            <table className="suppliersTable">
              <thead>
                <tr>
                  <th>name</th>
                  <th>country</th>
                  <th>categories</th>
                  <th>rate_per_shipment</th>
                  <th>currency</th>
                  <th>status</th>
                  <th>updated_at</th>
                  <th>service_zone</th>
                  <th>contact_email</th>
                  <th>notes</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>{supplier.name}</td>
                    <td>{supplier.country}</td>
                    <td>{supplier.categories.join(", ")}</td>
                    <td>
                      <div className="rateEditor">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={
                            rowRateDrafts[supplier.id] ??
                            String(supplier.rate_per_shipment)
                          }
                          onChange={(event) =>
                            setRowRateDrafts((current) => ({
                              ...current,
                              [supplier.id]: event.target.value,
                            }))
                          }
                        />

                        <button
                          type="button"
                          disabled={Boolean(rowPending[supplier.id])}
                          onClick={() => void handleRateUpdate(supplier)}
                        >
                          Actualizar
                        </button>
                      </div>
                    </td>
                    <td>{supplier.currency}</td>
                    <td>
                      <span
                        className={
                          supplier.status === "active"
                            ? "statusBadge statusActive"
                            : "statusBadge statusSuspended"
                        }
                      >
                        {supplier.status}
                      </span>
                    </td>
                    <td>{new Date(supplier.updated_at).toLocaleString()}</td>
                    <td>{supplier.service_zone ?? "-"}</td>
                    <td>{supplier.contact_email ?? "-"}</td>
                    <td>{supplier.notes ?? "-"}</td>
                    <td>
                      <button
                        type="button"
                        disabled={Boolean(rowPending[supplier.id])}
                        onClick={() => void handleStatusToggle(supplier)}
                      >
                        {supplier.status === "active" ? "Suspender" : "Activar"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

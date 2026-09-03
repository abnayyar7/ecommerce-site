"use client";

import { useState } from "react";
import FloatingInput from "./FloatingInput";
import { SearchableSelect } from "@/components";
import { INDIAN_STATES } from "@/config/staticValue";
import toast from "react-hot-toast";

const REQUIRED = ["name", "phone", "address1", "city", "state", "pincode", "country"];

const toForm = (a) => ({
  label: a?.label || "",
  name: a?.name || "",
  phone: a?.phone || "",
  address1: a?.address1 || "",
  address2: a?.address2 || "",
  city: a?.city || "",
  state: a?.state || "",
  pincode: a?.pincode || "",
  country: a?.country || "India",
  landmark: a?.landmark || "",
  isDefault: !!a?.isDefault,
});

// Address popup for the checkout carousel. Three modes:
//   view — full details of a saved address + actions
//   edit — full edit form for that address (PUT)
//   add  — blank form for a new address (POST)
// Backdrop + role="dialog" scaffolding mirrors MobileNavMenu.jsx (no library).
export default function CheckoutAddressPopup({
  address,
  initialMode = "view",
  onClose,
  onRefresh,
  onSelect,
  onDeleted,
}) {
  const [current, setCurrent] = useState(address); // local copy shown in view mode
  const [mode, setMode] = useState(initialMode); // "view" | "edit" | "add"
  const [form, setForm] = useState(() => toForm(initialMode === "add" ? null : address));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const validate = () => {
    const e = {};
    for (const k of REQUIRED) if (!String(form[k] || "").trim()) e[k] = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.error("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const isAdd = mode === "add";
      // TODO (parked): PUT updates the address row in place, which changes how
      // past orders that referenced it render. The real fix is snapshotting the
      // address onto the Order at creation time — parked for a future decision.
      const url = isAdd ? "/api/address" : `/api/address/${current.id}`;
      const res = await fetch(url, {
        method: isAdd ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        if (d.fieldErrors) setErrors(d.fieldErrors);
        toast.error(d.error || "Failed to save address.");
        return;
      }
      const saved = await res.json();
      await onRefresh?.();
      if (isAdd) {
        onSelect?.(saved.id); // auto-select the newly added address
        toast.success("Address added");
        onClose();
      } else {
        setCurrent(saved); // show the updated details
        setMode("view");
        toast.success("Address updated");
      }
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/address/${current.id}/default`, { method: "PATCH" });
      if (!res.ok) {
        toast.error("Failed to set default.");
        return;
      }
      await onRefresh?.();
      toast.success("Default address updated");
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const doDelete = async () => {
    setBusy(true);
    setErrorMsg("");
    try {
      const res = await fetch(`/api/address/${current.id}`, { method: "DELETE" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        // e.g. 409 order-linked — keep the popup open and show it inline.
        setErrorMsg(d.error || "Failed to delete address.");
        setConfirmDelete(false);
        return;
      }
      await onRefresh?.();
      onDeleted?.(current.id);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const title =
    mode === "add" ? "Add New Address" : mode === "edit" ? "Edit Address" : "Address Details";

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 w-full max-w-[480px] mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-[var(--color-inverted-text)]">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-gray-400 hover:text-gray-700 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {mode === "view" ? (
          <>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className="font-semibold uppercase tracking-wide">{current.label || "Address"}</span>
                {current.isDefault && (
                  <span className="rounded-full bg-[#24747C]/10 text-[#24747C] text-xs font-medium px-2 py-0.5">
                    Default
                  </span>
                )}
              </div>
              <p className="text-gray-800">
                {current.name}
                {current.phone ? ` · ${current.phone}` : ""}
              </p>
              <p className="text-gray-600">
                {current.address1}
                {current.address2 ? `, ${current.address2}` : ""}
              </p>
              <p className="text-gray-600">
                {current.city}, {current.state} - {current.pincode}
              </p>
              <p className="text-gray-600">{current.country}</p>
              {current.landmark && <p className="text-gray-500">Landmark: {current.landmark}</p>}
            </div>

            {errorMsg && <p className="mt-3 text-sm text-red-600">{errorMsg}</p>}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  onSelect?.(current.id);
                  onClose();
                }}
                className="rounded-md bg-[var(--color-bg)] text-[var(--color-text)] py-2 px-4 text-sm font-semibold hover:opacity-90"
              >
                Use this address
              </button>
              {!current.isDefault && (
                <button
                  onClick={setDefault}
                  disabled={busy}
                  className="rounded-md border border-[var(--color-bg)] text-[var(--color-bg)] py-2 px-4 text-sm font-semibold hover:bg-[var(--color-bg)]/5 disabled:opacity-50"
                >
                  Set as default
                </button>
              )}
              <button
                onClick={() => {
                  setForm(toForm(current));
                  setErrors({});
                  setMode("edit");
                }}
                className="rounded-md border border-gray-300 text-gray-700 py-2 px-4 text-sm font-semibold hover:bg-gray-50"
              >
                Edit
              </button>
              {confirmDelete ? (
                <span className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">Are you sure?</span>
                  <button
                    onClick={doDelete}
                    disabled={busy}
                    className="font-medium text-red-600 hover:underline disabled:opacity-50"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="font-medium text-gray-500 hover:underline"
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  onClick={() => {
                    setConfirmDelete(true);
                    setErrorMsg("");
                  }}
                  className="text-sm font-medium text-red-600 hover:underline"
                >
                  Delete
                </button>
              )}
            </div>

            <div className="mt-6 border-t pt-4">
              <button onClick={onClose} className="text-sm font-medium text-gray-500 hover:underline">
                Close
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-4">
              <FloatingInput name="label" label="Label (e.g. HOME, WORK)" value={form.label} onChange={setField} />
              <FloatingInput name="name" label="Name" value={form.name} onChange={setField} error={errors.name} required />
              <FloatingInput name="phone" label="Phone" value={form.phone} onChange={setField} error={errors.phone} required />
              <FloatingInput name="address1" label="Address Line 1" value={form.address1} onChange={setField} error={errors.address1} required />
              <FloatingInput name="address2" label="Address Line 2 (optional)" value={form.address2} onChange={setField} />
              <FloatingInput name="city" label="City" value={form.city} onChange={setField} error={errors.city} required />
              <SearchableSelect
                label="State"
                value={form.state}
                options={INDIAN_STATES}
                onChange={(val) => {
                  setField("state", val);
                  setErrors((e) => ({ ...e, state: undefined }));
                }}
                error={errors.state}
                placeholder="Select state"
              />
              <FloatingInput name="pincode" label="Pincode" value={form.pincode} onChange={setField} error={errors.pincode} required />
              <FloatingInput name="country" label="Country" value={form.country} onChange={setField} error={errors.country} required />
              <FloatingInput name="landmark" label="Landmark (optional)" value={form.landmark} onChange={setField} />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setField("isDefault", e.target.checked)}
                  className="accent-[var(--color-bg)]"
                />
                Set as default
              </label>
            </div>

            <div className="mt-6 flex items-center justify-between border-t pt-4">
              <button
                onClick={mode === "add" ? onClose : () => setMode("view")}
                className="text-sm font-medium text-gray-500 hover:underline"
              >
                {mode === "add" ? "Close" : "Cancel"}
              </button>
              <button
                onClick={submit}
                disabled={saving}
                className="rounded-md bg-[var(--color-bg)] text-[var(--color-text)] py-2 px-5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save Address"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

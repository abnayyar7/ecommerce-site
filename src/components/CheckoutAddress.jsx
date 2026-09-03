"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import { FiLoader, FiPlus, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import FloatingInput from "./FloatingInput";
import { SearchableSelect } from "@/components";
import { INDIAN_STATES } from "@/config/staticValue";
import CheckoutAddressPopup from "./CheckoutAddressPopup";

// Guests (and the unchanged inline flow) fill the address form directly. This is
// the original CheckoutAddress form, extracted verbatim — validation + duplicate
// detection intact.
function GuestAddressForm({ savedAddresses, editAddress, onSaveAndNext, alreadySubmitted }) {
  const [formValues, setFormValues] = useState({
    address1: "",
    address2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [saveDefault, setSaveDefault] = useState(false);

  useEffect(() => {
    if (editAddress) {
      setFormValues({
        address1: editAddress.address1 || "",
        address2: editAddress.address2 || "",
        city: editAddress.city || "",
        state: editAddress.state || "",
        pincode: editAddress.pincode || "",
        country: editAddress.country || "India",
      });
      setSaveDefault(!!editAddress.isDefault);
    }
  }, [editAddress]);

  const isDuplicate = useMemo(() => {
    return savedAddresses.some(
      (addr) =>
        addr.address1 === formValues.address1 &&
        addr.address2 === formValues.address2 &&
        addr.city === formValues.city &&
        addr.state === formValues.state &&
        addr.pincode === formValues.pincode,
    );
  }, [formValues, savedAddresses]);

  const validate = () => {
    const errs = {};
    if (!formValues.address1 || formValues.address1.trim().length < 3)
      errs.address1 = "Address line is required";
    if (!formValues.city) errs.city = "City required";
    if (!formValues.state) errs.state = "State required";
    if (!/^\d{6}$/.test(formValues.pincode || ""))
      errs.pincode = "6 digit pincode required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (isDuplicate && !editAddress) {
      alert("This address already exists.");
      return;
    }
    setLoading(true);
    const payload = { ...formValues, isDefault: saveDefault };
    setTimeout(() => {
      setLoading(false);
      onSaveAndNext(payload);
    }, 600);
  };

  const handleChange = (field, value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form space-y-6 relative">
      {loading && (
        <div className="loader-overlay">
          <FiLoader className="loader-spin" />
        </div>
      )}

      <FloatingInput name="address1" label="Address Line 1" value={formValues.address1} onChange={handleChange} error={errors.address1} />
      <FloatingInput name="address2" label="Address Line 2 (optional)" value={formValues.address2} onChange={handleChange} />
      <FloatingInput name="city" label="City" value={formValues.city} onChange={handleChange} error={errors.city} />
      <SearchableSelect label="State" value={formValues.state} options={INDIAN_STATES} onChange={(val) => handleChange("state", val)} error={errors.state} />
      <FloatingInput name="pincode" label="Pincode" value={formValues.pincode} onChange={handleChange} error={errors.pincode} />
      <FloatingInput name="country" label="Country" value={formValues.country} onChange={handleChange} />

      <div className="flex items-center gap-3 mt-3">
        <input id="saveDefault" type="checkbox" checked={saveDefault} onChange={(e) => setSaveDefault(e.target.checked)} />
        <label htmlFor="saveDefault" className="text-sm">Save this address</label>
      </div>

      <button type="submit" className="next-btn">
        {alreadySubmitted ? "Update Address" : "Save & Continue"}
      </button>
    </form>
  );
}

export default function CheckoutAddress({
  savedAddresses = [],
  selectedId = null,
  onSelectAddress,
  onSaveAndNext,
  editAddress = null,
  isLoggedIn = false,
  onRefreshAddresses,
  alreadySubmitted = false,
}) {
  const [popup, setPopup] = useState(null); // { address, mode } | null

  // Show arrows only when the track actually overflows — naturally handles the
  // desktop-3 / tablet-2 / mobile-1 visibility without hardcoding breakpoints.
  const trackRef = useRef(null);
  const [showArrows, setShowArrows] = useState(false);
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const check = () => setShowArrows(el.scrollWidth > el.clientWidth + 4);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [savedAddresses, isLoggedIn]);

  const scrollBy = (dir) => {
    trackRef.current?.scrollBy({ left: dir * 196, behavior: "smooth" });
  };

  // Guests keep the original inline form (existing behavior).
  if (!isLoggedIn) {
    return (
      <GuestAddressForm
        savedAddresses={savedAddresses}
        editAddress={editAddress}
        onSaveAndNext={onSaveAndNext}
        alreadySubmitted={alreadySubmitted}
      />
    );
  }

  const selected = savedAddresses.find((a) => a.id === selectedId) || null;

  const handleSaveContinue = () => {
    if (!selected) return;
    onSaveAndNext({
      address1: selected.address1,
      address2: selected.address2,
      city: selected.city,
      state: selected.state,
      country: selected.country,
      pincode: selected.pincode,
      isDefault: selected.isDefault,
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-sm font-medium">Select a delivery address</p>

      <div className="relative">
        {showArrows && (
          <button
            type="button"
            onClick={() => scrollBy(-1)}
            aria-label="Previous"
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-3 w-8 h-8 rounded-full bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center shadow"
          >
            <FiChevronLeft />
          </button>
        )}

        <div
          ref={trackRef}
          className="flex gap-4 overflow-x-auto snap-x scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {savedAddresses.map((a) => {
            const active = selectedId === a.id;
            return (
              <button
                type="button"
                key={a.id}
                onClick={() => setPopup({ address: a, mode: "view" })}
                className={`snap-start shrink-0 w-[180px] h-[120px] rounded-lg p-3 text-left flex flex-col bg-white transition ${
                  active ? "border-2 border-[#24747C]" : "border border-gray-300"
                }`}
              >
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide">{a.label || "Address"}</span>
                  {a.isDefault && (
                    <span className="rounded-full bg-[#24747C]/10 text-[#24747C] text-[10px] font-medium px-1.5 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium text-gray-800 truncate">{a.name}</p>
                <p className="text-xs text-gray-600 line-clamp-2 leading-4">{a.address1}</p>
                <p className="text-xs text-gray-600 mt-auto">
                  {a.city} - {a.pincode}
                </p>
              </button>
            );
          })}

          {/* + Add New card — always last, dashed to distinguish. */}
          <button
            type="button"
            onClick={() => setPopup({ address: null, mode: "add" })}
            className="snap-start shrink-0 w-[180px] h-[120px] rounded-lg border-2 border-dashed border-gray-300 p-3 flex flex-col items-center justify-center text-gray-500 hover:border-[var(--color-bg)] hover:text-[var(--color-bg)] transition"
          >
            <FiPlus className="text-2xl mb-1" />
            <span className="text-xs font-medium">Add New Address</span>
          </button>
        </div>

        {showArrows && (
          <button
            type="button"
            onClick={() => scrollBy(1)}
            aria-label="Next"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-3 w-8 h-8 rounded-full bg-[var(--color-bg)] text-[var(--color-text)] flex items-center justify-center shadow"
          >
            <FiChevronRight />
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={handleSaveContinue}
        disabled={!selected}
        className="next-btn disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {alreadySubmitted ? "Update Address" : "Save & Continue"}
      </button>

      {popup && (
        <CheckoutAddressPopup
          address={popup.address}
          initialMode={popup.mode}
          onClose={() => setPopup(null)}
          onRefresh={onRefreshAddresses}
          onSelect={(id) => onSelectAddress?.(id)}
          onDeleted={(id) => {
            if (id === selectedId) onSelectAddress?.(null);
          }}
        />
      )}
    </div>
  );
}

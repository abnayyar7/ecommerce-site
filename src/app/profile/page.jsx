"use client";
import { useSession } from "next-auth/react";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Breadcrumb, SearchableSelect } from "@/components";
import { INDIAN_STATES } from "@/config/staticValue";
import toast from "react-hot-toast";
import { isValidEmailAddressFormat, isValidPhoneNumber } from "@/scripts/utils";

const FloatingInput = ({
  label,
  type = "text",
  id,
  name,
  value,
  onChange,
  required = false,
}) => {
  return (
    <div className="relative w-full">
      <input
        type={type}
        name={name}
        id={id}
        value={value}
        onChange={onChange}
        required={required}
        placeholder=" "
        className="peer w-full rounded-md border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm text-gray-900 focus:border-[var(--color-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-bg)]"
      />
      <label
        htmlFor={id}
        className="absolute left-3 top-2 text-xs text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gray-600"
      >
        {label}
      </label>
    </div>
  );
};

const isValidFormattedDate = (dobStr) => {
  const [dd, mm, yyyy] = dobStr.split("/");
  const date = new Date(`${yyyy}-${mm}-${dd}`);
  return !isNaN(date.getTime());
};

const formatToDDMMYYYY = (date) => {
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const EMPTY_ADDRESS = {
  label: "",
  name: "",
  phone: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  landmark: "",
  isDefault: false,
};
const REQUIRED_ADDRESS_FIELDS = [
  "name",
  "phone",
  "address1",
  "city",
  "state",
  "pincode",
  "country",
];

const toDetailsForm = (p) => ({
  name: p?.name || "",
  email: p?.email || "",
  phone: p?.phone || "",
  dob: formatToDDMMYYYY(p?.dob),
  gender: p?.gender || "",
});

// ─────────────────────────── TAB 1: My Details ───────────────────────────
// Renders from the profileData prop. On save it refetches profile only (via
// onProfileChange), never touching the address dataset.
function MyDetailsTab({ profileData, onProfileChange }) {
  const [formData, setFormData] = useState(() => toDetailsForm(profileData));
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    setFormData(toDetailsForm(profileData));
    setIsChanged(false);
  }, [profileData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let newValue = value;

    if (name === "dob") {
      const raw = value.replace(/[^0-9]/g, "").slice(0, 8);
      if (raw.length >= 5)
        newValue = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
      else if (raw.length >= 3) newValue = `${raw.slice(0, 2)}/${raw.slice(2)}`;
      else newValue = raw;
    }

    const updated = { ...formData, [name]: newValue };
    setFormData(updated);
    setIsChanged(JSON.stringify(updated) !== JSON.stringify(toDetailsForm(profileData)));
  };

  const handleDatePick = (e) => {
    const date = new Date(e.target.value);
    const formatted = !isNaN(date.getTime())
      ? formatToDDMMYYYY(date)
      : formatToDDMMYYYY(new Date());
    setFormData((f) => ({ ...f, dob: formatted }));
    setIsChanged(true);
  };

  const validateForm = () => {
    if (!formData.name.trim()) return "Name is required.";
    if (!formData.email.trim() || !isValidEmailAddressFormat(formData.email))
      return "Invalid email.";
    if (!formData.phone.trim() || !isValidPhoneNumber(formData.phone))
      return "Invalid phone number.";
    if (!formData.dob || !isValidFormattedDate(formData.dob))
      return "Date of birth must be valid.";
    if (!formData.gender) return "Gender is required.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const [dd, mm, yyyy] = formData.dob.split("/");
    const formattedDOB = `${yyyy}-${mm}-${dd}`;

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...formData, dob: formattedDOB }),
    });

    if (res.ok) {
      toast.success("Profile updated successfully");
      setIsChanged(false);
      await onProfileChange(); // refetch profile dataset only
    } else {
      const errorData = await res.json();
      toast.error(errorData.message || "Failed to update profile");
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow space-y-6"
    >
      <FloatingInput label="Name" id="name" name="name" value={formData.name} onChange={handleChange} />
      <FloatingInput label="Email" id="email" name="email" value={formData.email} onChange={handleChange} type="email" />
      <FloatingInput label="Phone" id="phone" name="phone" value={formData.phone} onChange={handleChange} />

      <div className="relative w-full">
        <FloatingInput label="Date of Birth" id="dob" name="dob" value={formData.dob} onChange={handleChange} />
        <input
          type="date"
          className="absolute right-3 top-[10px] w-6 cursor-pointer opacity-70"
          onChange={handleDatePick}
          value={(() => {
            const [dd, mm, yyyy] = formData.dob.split("/");
            return yyyy && mm && dd ? `${yyyy}-${mm}-${dd}` : "";
          })()}
        />
      </div>

      <div className="relative w-full">
        <select
          id="gender"
          name="gender"
          value={formData.gender}
          onChange={handleChange}
          className="peer w-full rounded-md border border-gray-300 bg-white px-3 pt-5 pb-2 text-sm text-gray-900 focus:border-[var(--color-bg)] focus:outline-none focus:ring-1 focus:ring-[var(--color-bg)] appearance-none"
        >
          <option value="">Select Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
        <label
          htmlFor="gender"
          className="absolute left-3 top-2 text-xs text-gray-600 transition-all peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-focus:top-2 peer-focus:text-xs peer-focus:text-gray-600"
        >
          Gender
        </label>
      </div>

      <button
        type="submit"
        disabled={!isChanged}
        className="mt-4 w-full rounded-md bg-[var(--color-bg)] text-[var(--color-text)] py-2 px-4 text-sm font-semibold shadow-sm transition hover:opacity-90 disabled:opacity-50"
      >
        Save Changes
      </button>
    </form>
  );
}

// ─────────────────────────── TAB 2: Addresses ───────────────────────────
// The full address book. Renders from the addresses prop; every mutation
// refetches the address dataset only (onRefresh), leaving profile untouched.
function AddressesTab({ addresses, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null); // null = add mode
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [cardError, setCardError] = useState({}); // { [id]: message }
  const [busyId, setBusyId] = useState(null);

  const openAdd = () => {
    setEditingId(null);
    setForm(EMPTY_ADDRESS);
    setFormErrors({});
    setShowForm(true);
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setForm({
      label: a.label || "",
      name: a.name || "",
      phone: a.phone || "",
      address1: a.address1 || "",
      address2: a.address2 || "",
      city: a.city || "",
      state: a.state || "",
      pincode: a.pincode || "",
      country: a.country || "India",
      landmark: a.landmark || "",
      isDefault: !!a.isDefault,
    });
    setFormErrors({});
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_ADDRESS);
    setFormErrors({});
  };

  const handleField = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const saveForm = async () => {
    const errs = {};
    for (const key of REQUIRED_ADDRESS_FIELDS) {
      if (!String(form[key] || "").trim()) errs[key] = "Required";
    }
    if (Object.keys(errs).length) {
      setFormErrors(errs);
      toast.error("Please fill all required fields.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/address/${editingId}` : "/api/address";
      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.fieldErrors) setFormErrors(data.fieldErrors);
        toast.error(data.error || "Failed to save address.");
        return;
      }
      toast.success(editingId ? "Address updated" : "Address added");
      closeForm();
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  const setDefault = async (id) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/address/${id}/default`, { method: "PATCH" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Failed to set default.");
        return;
      }
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const doDelete = async (id) => {
    setBusyId(id);
    setCardError((m) => ({ ...m, [id]: "" }));
    try {
      const res = await fetch(`/api/address/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // Blocking errors (e.g. 409 order-linked) render inline on the card.
        setCardError((m) => ({ ...m, [id]: data.error || "Failed to delete address." }));
        setConfirmDeleteId(null);
        return;
      }
      setConfirmDeleteId(null);
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  };

  const addButton = (
    <button
      onClick={openAdd}
      className="rounded-md bg-[var(--color-bg)] text-[var(--color-text)] py-2.5 px-5 text-sm font-semibold transition hover:opacity-90"
    >
      + Add New Address
    </button>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {addresses.length === 0 && !showForm ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No saved addresses yet.</p>
          {addButton}
        </div>
      ) : (
        <>
          {!showForm && <div className="flex justify-end mb-4">{addButton}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm flex flex-col"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-inverted-text)]">
                    {a.label || "Address"}
                  </span>
                  {a.isDefault && (
                    <span className="rounded-full bg-[#24747C]/10 text-[#24747C] text-xs font-medium px-2 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm font-medium text-gray-800">{a.name}</p>
                <p className="text-sm text-gray-600">
                  {a.address1}, {a.city}, {a.state} - {a.pincode}
                </p>

                {cardError[a.id] && (
                  <p className="mt-2 text-sm text-red-600">{cardError[a.id]}</p>
                )}

                <div className="mt-auto pt-3 flex flex-wrap items-center gap-4 text-sm">
                  <button
                    onClick={() => openEdit(a)}
                    className="font-medium text-[var(--color-bg)] hover:underline"
                  >
                    Edit
                  </button>
                  {!a.isDefault && (
                    <button
                      onClick={() => setDefault(a.id)}
                      disabled={busyId === a.id}
                      className="font-medium text-[var(--color-bg)] hover:underline disabled:opacity-50"
                    >
                      Set as default
                    </button>
                  )}
                  {confirmDeleteId === a.id ? (
                    <span className="flex items-center gap-2">
                      <span className="text-gray-600">Are you sure?</span>
                      <button
                        onClick={() => doDelete(a.id)}
                        disabled={busyId === a.id}
                        className="font-medium text-red-600 hover:underline disabled:opacity-50"
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="font-medium text-gray-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <button
                      onClick={() => {
                        setConfirmDeleteId(a.id);
                        setCardError((m) => ({ ...m, [a.id]: "" }));
                      }}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showForm && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6 shadow space-y-4">
          <h3 className="text-lg font-semibold text-[var(--color-inverted-text)]">
            {editingId ? "Edit Address" : "Add New Address"}
          </h3>

          <FloatingInput label="Label (e.g. HOME, WORK)" id="addr-label" name="label" value={form.label} onChange={handleField} />

          <div>
            <FloatingInput label="Name" id="addr-name" name="name" value={form.name} onChange={handleField} required />
            {formErrors.name && <p className="mt-1 text-xs text-red-600">{formErrors.name}</p>}
          </div>
          <div>
            <FloatingInput label="Phone" id="addr-phone" name="phone" value={form.phone} onChange={handleField} required />
            {formErrors.phone && <p className="mt-1 text-xs text-red-600">{formErrors.phone}</p>}
          </div>
          <div>
            <FloatingInput label="Address Line 1" id="addr-a1" name="address1" value={form.address1} onChange={handleField} required />
            {formErrors.address1 && <p className="mt-1 text-xs text-red-600">{formErrors.address1}</p>}
          </div>
          <FloatingInput label="Address Line 2 (optional)" id="addr-a2" name="address2" value={form.address2} onChange={handleField} />
          <div>
            <FloatingInput label="City" id="addr-city" name="city" value={form.city} onChange={handleField} required />
            {formErrors.city && <p className="mt-1 text-xs text-red-600">{formErrors.city}</p>}
          </div>
          <div>
            <SearchableSelect
              label="State"
              value={form.state}
              options={INDIAN_STATES}
              onChange={(val) => {
                setForm((f) => ({ ...f, state: val }));
                setFormErrors((e) => ({ ...e, state: undefined }));
              }}
              placeholder="Select state"
              error={formErrors.state}
            />
          </div>
          <div>
            <FloatingInput label="Pincode" id="addr-pin" name="pincode" value={form.pincode} onChange={handleField} required />
            {formErrors.pincode && <p className="mt-1 text-xs text-red-600">{formErrors.pincode}</p>}
          </div>
          <FloatingInput label="Country" id="addr-country" name="country" value={form.country} onChange={handleField} required />
          <FloatingInput label="Landmark (optional)" id="addr-landmark" name="landmark" value={form.landmark} onChange={handleField} />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
              className="accent-[var(--color-bg)]"
            />
            Set as default
          </label>

          <div className="flex gap-3 pt-2">
            <button
              onClick={saveForm}
              disabled={saving}
              className="rounded-md bg-[var(--color-bg)] text-[var(--color-text)] py-2 px-5 text-sm font-semibold transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Address"}
            </button>
            <button
              onClick={closeForm}
              className="rounded-md border border-gray-300 py-2 px-5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Page shell + data boundary ───────────────────
function ProfileContent() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab") === "addresses" ? "addresses" : "details";

  const [profileData, setProfileData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch BOTH datasets once, in parallel, at the page boundary.
  useEffect(() => {
    if (!session?.user) return;
    setLoading(true);
    Promise.all([
      fetch("/api/profile").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/address").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([profile, addrs]) => {
        setProfileData(profile);
        setAddresses(Array.isArray(addrs) ? addrs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  // Per-dataset refetch — a mutation refreshes only what it changed.
  const refetchProfile = () =>
    fetch("/api/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setProfileData(d));
  const refetchAddresses = () =>
    fetch("/api/address")
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => setAddresses(Array.isArray(d) ? d : []));

  // Tab switch = URL update only, no data fetch (effect keys off session).
  const switchTab = (t) => {
    const params = new URLSearchParams(searchParams.toString());
    if (t === "details") params.delete("tab");
    else params.set("tab", t);
    const qs = params.toString();
    router.replace(`/profile${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  if (loading || !profileData) {
    return <p className="text-center py-10">Loading...</p>;
  }

  const tabs = [
    ["details", "My Details"],
    ["addresses", "Addresses"],
  ];

  return (
    <div className="min-h-screen bg-[var(--color-inverted-bg)] text-[var(--color-inverted-text)] px-6 md:px-24 py-12">
      <div className="text-black bg-white">
        <div className="max-w-screen-2xl mx-auto px-6 md:px-24">
          <div className="mb-4">
            <Breadcrumb />
          </div>
        </div>
      </div>

      <h1 className="text-center text-[var(--color-bg)] text-4xl md:text-5xl font-bold mb-8">
        My Account
      </h1>

      <div className="flex justify-center gap-2 border-b border-gray-200 mb-8 max-w-3xl mx-auto">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => switchTab(key)}
            className={`px-6 py-3 text-sm font-semibold border-b-2 -mb-px transition ${
              activeTab === key
                ? "border-[var(--color-bg)] text-[var(--color-bg)]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === "details" ? (
        <MyDetailsTab profileData={profileData} onProfileChange={refetchProfile} />
      ) : (
        <AddressesTab addresses={addresses} onRefresh={refetchAddresses} />
      )}
    </div>
  );
}

export default function ProfilePage() {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<p className="text-center py-10">Loading...</p>}>
      <ProfileContent />
    </Suspense>
  );
}

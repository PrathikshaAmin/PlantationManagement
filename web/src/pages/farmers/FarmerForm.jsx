import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/client";

const emptyForm = {
  farmerName: "", mobileNumber: "", alternateMobileNumber: "",
  gender: "", dateOfBirth: "",
  address: { village: "", taluk: "", district: "", state: "", pinCode: "" },
  primaryOccupation: "", farmingExperienceYears: "",
};

export default function FarmerForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      api.get(`/farmers/${id}`).then((res) => {
        const f = res.data.data;
        setForm({
          ...emptyForm,
          ...f,
          dateOfBirth: f.dateOfBirth ? f.dateOfBirth.slice(0, 10) : "",
          address: { ...emptyForm.address, ...f.address },
        });
      });
    }
  }, [id]);

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));
  const setAddressField = (field, value) =>
    setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      if (isEdit) {
        await api.put(`/farmers/${id}`, form);
      } else {
        await api.post("/farmers", form);
      }
      navigate("/farmers");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save farmer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1>{isEdit ? "Edit Farmer" : "Add Farmer"}</h1>
      {error && <div className="error-banner">{error}</div>}
      <form className="form-card" onSubmit={handleSubmit}>
        <h3>Personal Information</h3>
        <div className="form-row">
          <Field label="Farmer Name" value={form.farmerName} onChange={(v) => setField("farmerName", v)} required />
          <Field label="Mobile Number" value={form.mobileNumber} onChange={(v) => setField("mobileNumber", v)} required />
        </div>
        <div className="form-row">
          <Field label="Alternate Mobile" value={form.alternateMobileNumber} onChange={(v) => setField("alternateMobileNumber", v)} />
          <div className="field">
            <label>Gender</label>
            <select value={form.gender} onChange={(e) => setField("gender", e.target.value)}>
              <option value="">Select</option>
              <option>Male</option><option>Female</option><option>Other</option>
            </select>
          </div>
        </div>
        <Field label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(v) => setField("dateOfBirth", v)} />

        <h3>Address</h3>
        <div className="form-row">
          <Field label="Village" value={form.address.village} onChange={(v) => setAddressField("village", v)} />
          <Field label="Taluk" value={form.address.taluk} onChange={(v) => setAddressField("taluk", v)} />
        </div>
        <div className="form-row">
          <Field label="District" value={form.address.district} onChange={(v) => setAddressField("district", v)} />
          <Field label="State" value={form.address.state} onChange={(v) => setAddressField("state", v)} />
        </div>
        <Field label="PIN Code" value={form.address.pinCode} onChange={(v) => setAddressField("pinCode", v)} />

        <h3>Additional Information</h3>
        <div className="form-row">
          <Field label="Primary Occupation" value={form.primaryOccupation} onChange={(v) => setField("primaryOccupation", v)} />
          <Field label="Farming Experience (Years)" type="number" value={form.farmingExperienceYears} onChange={(v) => setField("farmingExperienceYears", v)} />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Saving..." : "Save Farmer"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false }) {
  return (
    <div className="field">
      <label>{label}{required && " *"}</label>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} />
    </div>
  );
}

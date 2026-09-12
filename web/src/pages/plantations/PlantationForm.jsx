import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../../api/client";

const emptyForm = {
  farmer: "", plantationName: "", plantationCode: "", plantationType: "",
  area: "", areaUnit: "Acres", numberOfPlants: "",
  address: { village: "", taluk: "", district: "", state: "" },
  irrigationMethod: "", waterSource: "", soilType: "",
  plantationAgeYears: "", plantVariety: "",
};

export default function PlantationForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ ...emptyForm, farmer: searchParams.get("farmer") || "" });
  const [farmers, setFarmers] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get("/farmers", { params: { limit: 200 } }).then((res) => setFarmers(res.data.data));
    if (isEdit) {
      api.get(`/plantations/${id}`).then((res) => {
        const p = res.data.data.plantation;
        setForm({
          ...emptyForm, ...p,
          farmer: p.farmer?._id || p.farmer,
          address: { ...emptyForm.address, ...p.address },
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
        await api.put(`/plantations/${id}`, form);
        navigate(`/plantations/${id}`);
      } else {
        const res = await api.post("/plantations", form);
        navigate(`/plantations/${res.data.data._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save plantation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <h1>{isEdit ? "Edit Plantation" : "Add Plantation"}</h1>
      {error && <div className="error-banner">{error}</div>}
      <form className="form-card" onSubmit={handleSubmit}>
        <h3>Basic Information</h3>
        <div className="form-row">
          <div className="field">
            <label>Farmer *</label>
            <select value={form.farmer} onChange={(e) => setField("farmer", e.target.value)} required disabled={isEdit}>
              <option value="">Select farmer</option>
              {farmers.map((f) => <option key={f._id} value={f._id}>{f.farmerName} ({f.mobileNumber})</option>)}
            </select>
          </div>
          <Field label="Plantation Type" value={form.plantationType} onChange={(v) => setField("plantationType", v)} placeholder="e.g. Coconut, Areca, Coffee" />
        </div>
        <div className="form-row">
          <Field label="Plantation Name" value={form.plantationName} onChange={(v) => setField("plantationName", v)} required />
          <Field label="Plantation Code" value={form.plantationCode} onChange={(v) => setField("plantationCode", v)} required />
        </div>

        <h3>Area Information</h3>
        <div className="form-row">
          <Field label="Area" type="number" value={form.area} onChange={(v) => setField("area", v)} required />
          <div className="field">
            <label>Area Unit</label>
            <select value={form.areaUnit} onChange={(e) => setField("areaUnit", e.target.value)}>
              <option>Acres</option><option>Hectares</option>
            </select>
          </div>
        </div>
        <Field label="Number of Plants/Trees" type="number" value={form.numberOfPlants} onChange={(v) => setField("numberOfPlants", v)} />

        <h3>Location</h3>
        <div className="form-row">
          <Field label="Village" value={form.address.village} onChange={(v) => setAddressField("village", v)} />
          <Field label="Taluk" value={form.address.taluk} onChange={(v) => setAddressField("taluk", v)} />
        </div>
        <div className="form-row">
          <Field label="District" value={form.address.district} onChange={(v) => setAddressField("district", v)} />
          <Field label="State" value={form.address.state} onChange={(v) => setAddressField("state", v)} />
        </div>

        <h3>Farming Information</h3>
        <div className="form-row">
          <Field label="Irrigation Method" value={form.irrigationMethod} onChange={(v) => setField("irrigationMethod", v)} />
          <Field label="Water Source" value={form.waterSource} onChange={(v) => setField("waterSource", v)} />
        </div>
        <Field label="Soil Type" value={form.soilType} onChange={(v) => setField("soilType", v)} />

        <h3>Plantation Information</h3>
        <div className="form-row">
          <Field label="Plantation Age (Years)" type="number" value={form.plantationAgeYears} onChange={(v) => setField("plantationAgeYears", v)} />
          <Field label="Plant Variety" value={form.plantVariety} onChange={(v) => setField("plantVariety", v)} />
        </div>

        <div className="form-actions">
          <button type="button" onClick={() => navigate(-1)}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? "Saving..." : "Save Plantation"}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", required = false, placeholder = "" }) {
  return (
    <div className="field">
      <label>{label}{required && " *"}</label>
      <input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} required={required} placeholder={placeholder} />
    </div>
  );
}

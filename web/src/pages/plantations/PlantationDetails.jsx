import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/client";

export default function PlantationDetails() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [images, setImages] = useState([]);
  const [activities, setActivities] = useState([]);

  const load = () => {
    api.get(`/plantations/${id}`).then((res) => setData(res.data.data));
    api.get(`/plantations/${id}/images`).then((res) => setImages(res.data.data));
    api.get(`/plantations/${id}/activities`).then((res) => setActivities(res.data.data));
  };

  useEffect(() => { load(); }, [id]);

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files.length) return;
    const formData = new FormData();
    Array.from(files).forEach((f) => formData.append("images", f));
    formData.append("category", "Plantation Overview");
    await api.post(`/plantations/${id}/images`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    load();
  };

  if (!data) return <div className="page">Loading...</div>;
  const { plantation, statistics, location } = data;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{plantation.plantationName}</h1>
        <Link to={`/plantations/${id}/edit`} className="btn-primary">Edit</Link>
      </div>

      <div className="detail-grid">
        <DetailBlock title="Plantation Info">
          <Row label="Code" value={plantation.plantationCode} />
          <Row label="Type" value={plantation.plantationType} />
          <Row label="Variety" value={plantation.plantVariety} />
          <Row label="Age" value={plantation.plantationAgeYears ? `${plantation.plantationAgeYears} yrs` : "-"} />
        </DetailBlock>

        <DetailBlock title="Owner">
          <Row label="Farmer" value={plantation.farmer?.farmerName} />
          <Row label="Mobile" value={plantation.farmer?.mobileNumber} />
          <Link to={`/farmers/${plantation.farmer?._id}`}>View farmer profile →</Link>
        </DetailBlock>

        <DetailBlock title="Area">
          <Row label="Area" value={`${plantation.area} ${plantation.areaUnit}`} />
          <Row label="Number of Plants" value={plantation.numberOfPlants} />
          <Row label="Soil Type" value={plantation.soilType} />
          <Row label="Irrigation" value={plantation.irrigationMethod} />
        </DetailBlock>

        <DetailBlock title="Statistics">
          <Row label="Photos" value={statistics.imageCount} />
          <Row label="Activity Entries" value={statistics.activityCount} />
          <Row label="Location" value={location ? `${location.latitude}, ${location.longitude}` : "Not captured"} />
        </DetailBlock>
      </div>

      {location && (
        <div className="detail-block">
          <h3>Map</h3>
          <iframe
            title="plantation-map"
            width="100%"
            height="300"
            style={{ border: 0, borderRadius: 8 }}
            src={`https://maps.google.com/maps?q=${location.latitude},${location.longitude}&z=15&output=embed`}
          />
        </div>
      )}

      <div className="detail-block">
        <div className="page-header">
          <h3>Photos</h3>
          <label className="btn-primary" style={{ cursor: "pointer" }}>
            Upload
            <input type="file" multiple accept="image/jpeg,image/png" onChange={handleUpload} hidden />
          </label>
        </div>
        <div className="gallery">
          {images.map((img) => (
            <div key={img._id} className="gallery-item">
              <img src={`${import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000"}${img.imageUrl}`} alt={img.category} />
              <span>{img.category}</span>
            </div>
          ))}
          {images.length === 0 && <p className="empty">No photos yet</p>}
        </div>
      </div>

      <div className="detail-block">
        <h3>Activity History</h3>
        <ul className="activity-list">
          {activities.map((a) => (
            <li key={a._id}>
              <strong>{a.activityType}</strong> — {a.remarks}
              <span className="activity-date">{new Date(a.activityDate).toLocaleString()}</span>
            </li>
          ))}
          {activities.length === 0 && <p className="empty">No activity recorded yet</p>}
        </ul>
      </div>
    </div>
  );
}

function DetailBlock({ title, children }) {
  return <div className="detail-block"><h3>{title}</h3>{children}</div>;
}
function Row({ label, value }) {
  return <div className="detail-row"><span>{label}</span><strong>{value || "-"}</strong></div>;
}

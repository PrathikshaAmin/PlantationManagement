import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../../api/client";

export default function FarmerDetails() {
  const { id } = useParams();
  const [farmer, setFarmer] = useState(null);
  const [plantations, setPlantations] = useState([]);

  useEffect(() => {
    api.get(`/farmers/${id}`).then((res) => setFarmer(res.data.data));
    api.get("/plantations", { params: { farmer: id, limit: 50 } })
      .then((res) => setPlantations(res.data.data));
  }, [id]);

  if (!farmer) return <div className="page">Loading...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{farmer.farmerName}</h1>
        <Link to={`/farmers/${id}/edit`} className="btn-primary">Edit</Link>
      </div>

      <div className="detail-grid">
        <DetailBlock title="Basic Information">
          <Row label="Mobile" value={farmer.mobileNumber} />
          <Row label="Alternate Mobile" value={farmer.alternateMobileNumber} />
          <Row label="Gender" value={farmer.gender} />
          <Row label="Date of Birth" value={farmer.dateOfBirth ? new Date(farmer.dateOfBirth).toLocaleDateString() : "-"} />
        </DetailBlock>

        <DetailBlock title="Address">
          <Row label="Village" value={farmer.address?.village} />
          <Row label="Taluk" value={farmer.address?.taluk} />
          <Row label="District" value={farmer.address?.district} />
          <Row label="State" value={farmer.address?.state} />
          <Row label="PIN Code" value={farmer.address?.pinCode} />
        </DetailBlock>

        <DetailBlock title="Additional">
          <Row label="Occupation" value={farmer.primaryOccupation} />
          <Row label="Experience" value={farmer.farmingExperienceYears ? `${farmer.farmingExperienceYears} years` : "-"} />
          <Row label="Plantations" value={farmer.plantationCount ?? 0} />
          <Row label="Last Updated" value={new Date(farmer.updatedAt).toLocaleString()} />
        </DetailBlock>
      </div>

      <h3>Plantations</h3>
      <table className="data-table">
        <thead><tr><th>Name</th><th>Code</th><th>Type</th><th>Area</th></tr></thead>
        <tbody>
          {plantations.map((p) => (
            <tr key={p._id}>
              <td><Link to={`/plantations/${p._id}`}>{p.plantationName}</Link></td>
              <td>{p.plantationCode}</td>
              <td>{p.plantationType || "-"}</td>
              <td>{p.area} {p.areaUnit}</td>
            </tr>
          ))}
          {plantations.length === 0 && <tr><td colSpan={4} className="empty">No plantations yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function DetailBlock({ title, children }) {
  return <div className="detail-block"><h3>{title}</h3>{children}</div>;
}
function Row({ label, value }) {
  return <div className="detail-row"><span>{label}</span><strong>{value || "-"}</strong></div>;
}

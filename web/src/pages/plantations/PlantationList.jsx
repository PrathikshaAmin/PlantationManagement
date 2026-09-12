import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

export default function PlantationList() {
  const [plantations, setPlantations] = useState([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchPlantations = (page = 1, searchTerm = search) => {
    setLoading(true);
    api.get("/plantations", { params: { search: searchTerm, page, limit: 10 } })
      .then((res) => {
        setPlantations(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPlantations(1, ""); }, []);

  const handleSearch = (e) => { e.preventDefault(); fetchPlantations(1, search); };

  const handleDelete = async (id) => {
    if (!confirm("Delete this plantation?")) return;
    await api.delete(`/plantations/${id}`);
    fetchPlantations(pagination.page);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Plantations</h1>
        <Link to="/plantations/new" className="btn-primary">+ Add Plantation</Link>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input placeholder="Search by name or code..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <button type="submit">Search</button>
      </form>

      {loading ? <p>Loading...</p> : (
        <>
          <table className="data-table">
            <thead>
              <tr><th>Name</th><th>Code</th><th>Type</th><th>Area</th><th>Farmer</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {plantations.map((p) => (
                <tr key={p._id}>
                  <td><Link to={`/plantations/${p._id}`}>{p.plantationName}</Link></td>
                  <td>{p.plantationCode}</td>
                  <td>{p.plantationType || "-"}</td>
                  <td>{p.area} {p.areaUnit}</td>
                  <td>{p.farmer?.farmerName || "-"}</td>
                  <td className="actions">
                    <Link to={`/plantations/${p._id}/edit`}>Edit</Link>
                    <button className="link-danger" onClick={() => handleDelete(p._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {plantations.length === 0 && <tr><td colSpan={6} className="empty">No plantations found</td></tr>}
            </tbody>
          </table>

          <div className="pager">
            <button disabled={pagination.page <= 1} onClick={() => fetchPlantations(pagination.page - 1)}>Prev</button>
            <span>Page {pagination.page} of {pagination.pages || 1}</span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => fetchPlantations(pagination.page + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

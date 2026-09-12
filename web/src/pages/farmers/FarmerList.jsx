import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api/client";

export default function FarmerList() {
  const [farmers, setFarmers] = useState([]);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ page: 1, pages: 1 });
  const [loading, setLoading] = useState(true);

  const fetchFarmers = (page = 1, searchTerm = search) => {
    setLoading(true);
    api
      .get("/farmers", { params: { search: searchTerm, page, limit: 10 } })
      .then((res) => {
        setFarmers(res.data.data);
        setPagination(res.data.pagination);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchFarmers(1, ""); }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFarmers(1, search);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this farmer?")) return;
    await api.delete(`/farmers/${id}`);
    fetchFarmers(pagination.page);
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>Farmers</h1>
        <Link to="/farmers/new" className="btn-primary">+ Add Farmer</Link>
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          placeholder="Search by name or mobile number..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th><th>Mobile</th><th>District</th>
                <th>Plantations</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f._id}>
                  <td><Link to={`/farmers/${f._id}`}>{f.farmerName}</Link></td>
                  <td>{f.mobileNumber}</td>
                  <td>{f.address?.district || "-"}</td>
                  <td>{f.plantationCount ?? 0}</td>
                  <td className="actions">
                    <Link to={`/farmers/${f._id}/edit`}>Edit</Link>
                    <button className="link-danger" onClick={() => handleDelete(f._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {farmers.length === 0 && (
                <tr><td colSpan={5} className="empty">No farmers found</td></tr>
              )}
            </tbody>
          </table>

          <div className="pager">
            <button disabled={pagination.page <= 1} onClick={() => fetchFarmers(pagination.page - 1)}>Prev</button>
            <span>Page {pagination.page} of {pagination.pages || 1}</span>
            <button disabled={pagination.page >= pagination.pages} onClick={() => fetchFarmers(pagination.page + 1)}>Next</button>
          </div>
        </>
      )}
    </div>
  );
}

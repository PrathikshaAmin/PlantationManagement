import { useEffect, useState } from "react";
import api from "../api/client";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";

const COLORS = ["#2f6d3c", "#5a9367", "#8fbc94", "#c8dfc4", "#e8f0e2", "#a3c9a8"];

export default function Dashboard() {
  const [farmerStats, setFarmerStats] = useState(null);
  const [plantationStats, setPlantationStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get("/dashboard/farmers"),
      api.get("/dashboard/plantations"),
    ])
      .then(([f, p]) => {
        setFarmerStats(f.data.data);
        setPlantationStats(p.data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page">Loading dashboard...</div>;

  return (
    <div className="page">
      <h1>Dashboard</h1>

      <div className="stat-grid">
        <StatCard label="Total Farmers" value={farmerStats?.totalFarmers ?? 0} />
        <StatCard label="Active Farmers" value={farmerStats?.activeFarmers ?? 0} />
        <StatCard label="Added (30 days)" value={farmerStats?.recentlyAddedFarmers ?? 0} />
        <StatCard label="Total Plantations" value={plantationStats?.totalPlantations ?? 0} />
        <StatCard label="Total Area" value={plantationStats?.totalArea ?? 0} />
      </div>

      <div className="chart-grid">
        <div className="chart-card">
          <h3>Farmers by District</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={farmerStats?.districtWise || []}>
              <XAxis dataKey="district" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#2f6d3c" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <h3>Plantation Type Distribution</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={plantationStats?.typeDistribution || []}
                dataKey="count"
                nameKey="type"
                outerRadius={90}
                label
              >
                {(plantationStats?.typeDistribution || []).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-card">
        <h3>Recently Updated Plantations</h3>
        <table className="data-table">
          <thead>
            <tr><th>Name</th><th>Code</th><th>Farmer</th><th>Updated</th></tr>
          </thead>
          <tbody>
            {(plantationStats?.recentlyUpdated || []).map((p) => (
              <tr key={p._id}>
                <td>{p.plantationName}</td>
                <td>{p.plantationCode}</td>
                <td>{p.farmer?.farmerName || "-"}</td>
                <td>{new Date(p.updatedAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

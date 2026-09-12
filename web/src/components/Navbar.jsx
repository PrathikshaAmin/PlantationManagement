import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">Plantation Management</div>
      <div className="navbar-links">
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/farmers">Farmers</Link>
        <Link to="/plantations">Plantations</Link>
      </div>
      <div className="navbar-user">
        <span>{user.fullName}</span>
        <button onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
}

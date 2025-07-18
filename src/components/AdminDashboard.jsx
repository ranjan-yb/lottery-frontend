import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

export default function AdminDashboard() {
  const [keys, setKeys] = useState([]);
  const [ownerName, setOwnerName] = useState("");
  const [usageLimit, setUsageLimit] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("adminToken");

  const fetchKeys = useCallback(async () => {
    setFetching(true);
    try {
      const res = await axios.get(`${API_URL}/api/admin/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;

      // 🧠 Defensive check
      if (Array.isArray(data)) {
        setKeys(data);
      } else if (Array.isArray(data.keys)) {
        setKeys(data.keys);
      } else {
        setKeys([]); // fallback empty
        console.error("Unexpected data format:", data);
      }
    } catch (err) {
      alert("Failed to fetch keys");
    } finally {
      setFetching(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return navigate("/admin-login");
    fetchKeys();
  }, [fetchKeys, token, navigate]);

  const handleCreate = async () => {
    try {
      setLoading(true);
      const res = await axios.post(
        `${API_URL}/api/admin/keys`,
        { ownerName, usageLimit },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("✅ API Key created:\n" + res.data.key);
      setOwnerName("");
      fetchKeys();
    } catch (err) {
      alert("❌ Failed to create key");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await axios.patch(
        `${API_URL}/api/admin/keys/${id}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchKeys();
    } catch (err) {
      alert("❌ Failed to toggle key status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this key?")) return;
    try {
      await axios.delete(`${API_URL}/api/admin/keys/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchKeys();
    } catch (err) {
      alert("❌ Failed to delete key");
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-white">
        🔐 API Key Admin Panel
      </h1>

      <button
        onClick={() => {
          localStorage.removeItem("adminToken");
          navigate("/admin-login");
        }}
        className="absolute top-4 right-4 bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
      >
        Logout
      </button>

      <div className="bg-white p-4 rounded shadow mb-6">
        <h2 className="font-semibold mb-3">Create New Key</h2>
        <input
          type="text"
          placeholder="Owner Name"
          value={ownerName}
          onChange={(e) => setOwnerName(e.target.value)}
          className="border p-2 mr-2 rounded"
        />
        <input
          type="number"
          placeholder="Usage Limit"
          value={usageLimit}
          onChange={(e) => setUsageLimit(Number(e.target.value))}
          className="border p-2 mr-2 rounded w-36"
        />
        <button
          onClick={handleCreate}
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? "Creating..." : "Create Key"}
        </button>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-4">Existing API Keys</h2>
        {fetching ? (
          <p>Loading keys...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-auto text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="text-left p-2">Key</th>
                  <th className="text-left p-2">Owner</th>
                  <th className="text-center p-2">Used</th>
                  <th className="text-center p-2">Limit</th>
                  <th className="text-center p-2">Status</th>
                  <th className="text-center p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {keys.map((k) => (
                  <tr key={k._id} className="border-t hover:bg-gray-50">
                    <td className="p-2 truncate max-w-xs">{k.key}</td>
                    <td className="p-2">{k.ownerName}</td>
                    <td className="text-center p-2">{k.requestsMade}</td>
                    <td className="text-center p-2">{k.usageLimit}</td>
                    <td className="text-center p-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          k.isActive
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {k.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="text-center p-2 space-x-2">
                      <button
                        onClick={() => handleToggle(k._id)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Toggle
                      </button>
                      <button
                        onClick={() => handleDelete(k._id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {keys.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-500 py-4">
                      No API keys found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

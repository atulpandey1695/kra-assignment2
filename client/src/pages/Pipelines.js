import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Pipelines = () => {
  const [pipelines, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/pipelines?page=1&limit=20")
      .then((res) => res.json())
      .then((data) => {
        setPipelines(data.pipelines || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching pipelines:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <p className="p-6">Loading pipelines...</p>;
  }

  if (!pipelines.length) {
    return <p className="p-6">No pipelines found.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Pipelines</h1>
        <p className="text-gray-600">Manage and monitor your CI/CD pipelines</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <table className="min-w-full border border-gray-200 rounded-lg">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">ID</th>
              <th className="px-4 py-2 border">Name</th>
              <th className="px-4 py-2 border">Status</th>
              <th className="px-4 py-2 border">Branch</th>
              <th className="px-4 py-2 border">Commit</th>
              <th className="px-4 py-2 border">Build Time</th>
              <th className="px-4 py-2 border">Created At</th>
            </tr>
          </thead>
          <tbody>
            {pipelines.map((p) => (
              <tr key={p.id} className="text-center">
                <td className="px-4 py-2 border">{p.id}</td>
                <td className="px-4 py-2 border">
                  <Link
                    to={`/pipelines/${p.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    {p.name}
                  </Link>
                </td>
                <td
                  className={`px-4 py-2 border ${
                    p.status === "failed"
                      ? "text-red-500"
                      : p.status === "success"
                      ? "text-green-600"
                      : "text-gray-600"
                  }`}
                >
                  {p.status}
                </td>
                <td className="px-4 py-2 border">{p.branch || "-"}</td>
                <td className="px-4 py-2 border">
                  {p.commit_hash ? p.commit_hash.slice(0, 7) : "-"}
                </td>
                <td className="px-4 py-2 border">
                  {p.build_time ? `${p.build_time}s` : "-"}
                </td>
                <td className="px-4 py-2 border">
                  {new Date(p.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Pipelines;

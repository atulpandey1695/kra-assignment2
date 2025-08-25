import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const PipelineDetail = () => {
  const { id } = useParams();
  const [pipeline, setPipeline] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPipeline = async () => {
      try {
	const res = await fetch(`/api/pipelines/${id}`);      
        if (!res.ok) {
          throw new Error(`API error: ${res.status}`);
        }
        const data = await res.json();

        // Handle case where backend returns error object
        if (data.error) {
          setError(data.error);
        } else {
          setPipeline(data);
        }
      } catch (err) {
        console.error("Error fetching pipeline details:", err);
        setError("Failed to load pipeline details.");
      } finally {
        setLoading(false);
      }
    };

    fetchPipeline();
  }, [id]);

  if (loading) {
    return <p className="p-6">Loading pipeline details...</p>;
  }

  if (error) {
    return (
      <div className="p-6 text-red-600">
        <p>Error: {error}</p>
        <Link to="/pipelines" className="text-blue-600 hover:underline text-sm">
          ← Back to Pipelines
        </Link>
      </div>
    );
  }

  if (!pipeline) {
    return (
      <div className="p-6 text-red-600">
        <p>Pipeline not found.</p>
        <Link to="/pipelines" className="text-blue-600 hover:underline text-sm">
          ← Back to Pipelines
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Pipeline: {pipeline.name}
        </h1>
        <p className="text-gray-600">ID: {pipeline.id}</p>
        <Link to="/pipelines" className="text-blue-600 hover:underline text-sm">
          ← Back to Pipelines
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <strong>Status:</strong>{" "}
            <span
              className={
                pipeline.status === "failed"
                  ? "text-red-500"
                  : pipeline.status === "success"
                  ? "text-green-600"
                  : "text-gray-600"
              }
            >
              {pipeline.status}
            </span>
          </div>
          <div>
            <strong>Branch:</strong> {pipeline.branch || "-"}
          </div>
          <div>
            <strong>Commit:</strong>{" "}
            {pipeline.commit_hash ? pipeline.commit_hash.slice(0, 7) : "-"}
          </div>
          <div>
            <strong>Build Time:</strong>{" "}
            {pipeline.build_time ? `${pipeline.build_time}s` : "-"}
          </div>
          <div>
            <strong>Trigger Type:</strong> {pipeline.trigger_type || "-"}
          </div>
          <div>
            <strong>Created At:</strong>{" "}
            {pipeline.created_at
              ? new Date(pipeline.created_at).toLocaleString()
              : "-"}
          </div>
          <div>
            <strong>Updated At:</strong>{" "}
            {pipeline.updated_at
              ? new Date(pipeline.updated_at).toLocaleString()
              : "-"}
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 mt-4 mb-2">
            Logs
          </h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
            {pipeline.logs || "No logs available."}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default PipelineDetail;


import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import { getRepositories } from "../services/api";

function Repositories() {
  const navigate = useNavigate();

  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadRepositories() {
      try {
        const data = await getRepositories();
        setRepositories(data);
      } catch (error) {
        console.error("Unable to load repositories:", error);
        setError("Unable to load your repositories.");
      } finally {
        setLoading(false);
      }
    }

    loadRepositories();
  }, []);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1>My repositories</h1>
          <p>
            All repositories available from your GitHub account.
          </p>
        </div>
      </div>

      {loading && <p>Loading repositories...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && repositories.length === 0 && (
        <p>No repositories found.</p>
      )}

      {!loading && !error && repositories.length > 0 && (
        <div className="repository-grid">
          {repositories.map((repo) => (
            <div
              className="repository-card"
              key={repo.id}
            >
              <div className="repository-card-top">
                <h3>{repo.name}</h3>

                <span className="visibility">
                  {repo.isPrivate ? "Private" : "Public"}
                </span>
              </div>

              <p>
                {repo.description ||
                  "No description provided."}
              </p>

              <div className="repository-meta">
                <span>
                  {repo.language || "Unknown"}
                </span>

                <span>
                  {repo.defaultBranch}
                </span>
              </div>

              <button
                className="button secondary full-width"
                onClick={() =>
                  navigate(`/repositories/${repo.id}`)
                }
              >
                Open repository
              </button>
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

export default Repositories;
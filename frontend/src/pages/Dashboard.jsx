import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout";
import {
  API_BASE_URL,
  getLoginUrl,
  getRepositories,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";

function Dashboard() {
  const navigate = useNavigate();

  const { user, loading: authLoading } = useAuth();

  const [repositories, setRepositories] = useState([]);
  const [repositoriesLoading, setRepositoriesLoading] = useState(false);
  const [repositoriesError, setRepositoriesError] = useState("");

  async function handleConnectGitHub() {
    try {
      const data = await getLoginUrl();

      window.location.href = `${API_BASE_URL}${data.url}`;
    } catch (error) {
      console.error("GitHub login failed:", error);
    }
  }

  useEffect(() => {
    if (!user) {
      setRepositories([]);
      return;
    }

    async function loadRepositories() {
      try {
        setRepositoriesLoading(true);
        setRepositoriesError("");

        const data = await getRepositories();

        setRepositories(data);
      } catch (error) {
        console.error("Unable to load repositories:", error);

        setRepositoriesError(
          "Unable to load your repositories."
        );
      } finally {
        setRepositoriesLoading(false);
      }
    }

    loadRepositories();
  }, [user]);

  if (authLoading) {
    return (
      <AppLayout>
        <div className="page-header">
          <div>
            <h1>Loading...</h1>
            <p>Checking your GitHub connection.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1>
            {user
              ? `Welcome, ${user.displayName}`
              : "Dashboard"}
          </h1>

          <p>
            {user
              ? "Your GitHub repositories and recent activity."
              : "Connect your GitHub account to get started."}
          </p>
        </div>

        {!user && (
          <button
            className="button primary"
            onClick={handleConnectGitHub}
          >
            Connect GitHub
          </button>
        )}
      </div>

      <section className="dashboard-section">
        <div className="section-title">
          <h2>Your repositories</h2>

          <button
            className="button secondary"
            onClick={() => navigate("/repositories")}
          >
            View all
          </button>
        </div>

        {repositoriesLoading && (
          <p>Loading your repositories...</p>
        )}

        {repositoriesError && (
          <p>{repositoriesError}</p>
        )}

        {!repositoriesLoading &&
          !repositoriesError &&
          user &&
          repositories.length === 0 && (
            <p>No repositories found.</p>
          )}

        {!repositoriesLoading &&
          !repositoriesError &&
          repositories.length > 0 && (
            <div className="repository-grid">
              {repositories.slice(0, 4).map((repo) => (
                <div
                  className="repository-card"
                  key={repo.id}
                >
                  <div className="repository-card-top">
                    <h3>{repo.name}</h3>

                    <span className="visibility">
                      {repo.isPrivate
                        ? "Private"
                        : "Public"}
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
                    onClick={() => {
                      window.open(
                        repo.htmlUrl,
                        "_blank",
                        "noopener,noreferrer"
                      );
                    }}
                  >
                    Open repository
                  </button>
                </div>
              ))}
            </div>
          )}
      </section>

      <section className="dashboard-section">
        <div className="section-title">
          <div>
            <h2>Recent chats</h2>

            <p>Continue where you left off.</p>
          </div>
        </div>

        <div className="chat-list">
          <div className="chat-row">
            <div>
              <strong>my-project</strong>

              <span>
                How does authentication work?
              </span>
            </div>

            <span>Today</span>
          </div>

          <div className="chat-row">
            <div>
              <strong>another-project</strong>

              <span>
                Explain the service architecture
              </span>
            </div>

            <span>Yesterday</span>
          </div>
        </div>
      </section>
    </AppLayout>
  );
}

export default Dashboard;
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

import {
  getRepository,
  indexRepository,
} from "../services/api";

function RepositoryDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [repository, setRepository] = useState(null);
  const [loading, setLoading] = useState(true);
  const [indexing, setIndexing] = useState(false);
  const [error, setError] = useState("");
  const [indexError, setIndexError] = useState("");

  /*
   * Load repository details.
   */
  async function loadRepository() {
    try {
      setError("");

      const data = await getRepository(id);

      setRepository(data);

      return data;
    } catch (error) {
      console.error(
        "Unable to load repository:",
        error
      );

      setError(
        error.message ||
          "Unable to load repository."
      );

      return null;
    }
  }

  /*
   * Initial repository load.
   */
  useEffect(() => {
    async function initialize() {
      setLoading(true);

      await loadRepository();

      setLoading(false);
    }

    initialize();
  }, [id]);

  /*
   * Automatically check indexing status.
   *
   * When indexing starts, the backend performs the
   * actual indexing asynchronously. Therefore the
   * first POST response may still contain INDEXING.
   *
   * We poll the repository until it becomes READY
   * or FAILED.
   */
  useEffect(() => {
    if (!repository) {
      return;
    }

    if (repository.indexStatus !== "INDEXING") {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const updatedRepository =
          await getRepository(id);

        setRepository(updatedRepository);

        if (
          updatedRepository.indexStatus === "READY" ||
          updatedRepository.indexStatus === "FAILED"
        ) {
          setIndexing(false);
        }
      } catch (error) {
        console.error(
          "Unable to refresh repository status:",
          error
        );
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [id, repository?.indexStatus]);

  /*
   * Start / re-start repository indexing.
   */
  async function handleIndexRepository() {
    try {
      setIndexing(true);
      setIndexError("");

      const updatedRepository =
        await indexRepository(id);

      setRepository(updatedRepository);
    } catch (error) {
      console.error(
        "Unable to index repository:",
        error
      );

      setIndexError(
        error.message ||
          "Unable to start repository indexing."
      );

      setIndexing(false);
    }
  }

  /*
   * Loading state.
   */
  if (loading) {
    return (
      <AppLayout>
        <div className="page-header">
          <div>
            <h1>Loading repository...</h1>

            <p>
              Please wait while we load the
              repository details.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  /*
   * Error state.
   */
  if (error || !repository) {
    return (
      <AppLayout>
        <div className="page-header">
          <div>
            <h1>Repository not found</h1>

            <p>
              {error ||
                "Unable to find this repository."}
            </p>
          </div>

          <button
            className="button secondary"
            onClick={() =>
              navigate("/repositories")
            }
          >
            Back to repositories
          </button>
        </div>
      </AppLayout>
    );
  }

  const isIndexing =
    indexing ||
    repository.indexStatus === "INDEXING";

  const isReady =
    repository.indexStatus === "READY";

  const isFailed =
    repository.indexStatus === "FAILED";

  const isNotIndexed =
    repository.indexStatus === "NOT_INDEXED" ||
    repository.indexStatus === "PENDING";

  return (
    <AppLayout>
      {/* =========================
          PAGE HEADER
         ========================= */}

      <div className="page-header">
        <div>
          <h1>{repository.name}</h1>

          <p>
            {repository.description ||
              "No description provided."}
          </p>
        </div>

        <button
          className="button secondary"
          onClick={() =>
            navigate("/repositories")
          }
        >
          Back to repositories
        </button>
      </div>

      {/* =========================
          REPOSITORY INFORMATION
         ========================= */}

      <section className="repository-details-card">
        <div className="repository-details-header">
          <div>
            <h2>{repository.fullName}</h2>

            <span className="visibility">
              {repository.isPrivate
                ? "Private"
                : "Public"}
            </span>
          </div>

          {repository.htmlUrl && (
            <button
              className="button secondary"
              onClick={() => {
                window.open(
                  repository.htmlUrl,
                  "_blank",
                  "noopener,noreferrer"
                );
              }}
            >
              View on GitHub
            </button>
          )}
        </div>

        <div className="repository-details-grid">
          <div className="repository-detail-item">
            <span>Language</span>

            <strong>
              {repository.language ||
                "Unknown"}
            </strong>
          </div>

          <div className="repository-detail-item">
            <span>Default branch</span>

            <strong>
              {repository.defaultBranch}
            </strong>
          </div>

          <div className="repository-detail-item">
            <span>Visibility</span>

            <strong>
              {repository.isPrivate
                ? "Private"
                : "Public"}
            </strong>
          </div>

          <div className="repository-detail-item">
            <span>Index status</span>

            <strong>
              {repository.indexStatus ||
                "NOT_INDEXED"}
            </strong>
          </div>
        </div>
      </section>

      {/* =========================
          REPOSITORY AI
         ========================= */}

      <section className="repository-details-card">
        <div className="section-title">
          <div>
            <h2>Repository AI</h2>

            <p>
              Index this repository to enable
              GitChat's AI-powered code chat.
            </p>
          </div>
        </div>

        <div className="repository-ai-placeholder">

          {/* =========================
              INDEXING
             ========================= */}

          {isIndexing && (
            <>
              <p>
                Repository indexing is in
                progress. Please wait...
              </p>

              <button
                className="button primary"
                disabled
              >
                Indexing...
              </button>
            </>
          )}

          {/* =========================
              READY
             ========================= */}

          {isReady && !isIndexing && (
            <>
              <p>
                This repository has been indexed
                successfully. You can now chat
                with your codebase.
              </p>

              <div className="repository-ai-actions">
                <button
                  className="button primary"
                  onClick={() =>
                    navigate(
                      `/repositories/${id}/chat`
                    )
                  }
                >
                  Chat with Repository
                </button>

                <button
                  className="button secondary"
                  onClick={
                    handleIndexRepository
                  }
                >
                  Re-index Repository
                </button>
              </div>
            </>
          )}

          {/* =========================
              NOT INDEXED
             ========================= */}

          {isNotIndexed && !isIndexing && (
            <>
              <p>
                Index this repository to enable
                AI-powered code chat.
              </p>

              <button
                className="button primary"
                onClick={
                  handleIndexRepository
                }
              >
                Index Repository
              </button>
            </>
          )}

          {/* =========================
              FAILED
             ========================= */}

          {isFailed && !isIndexing && (
            <>
              <p>
                Repository indexing failed.
                Please try indexing again.
              </p>

              <button
                className="button primary"
                onClick={
                  handleIndexRepository
                }
              >
                Re-index Repository
              </button>
            </>
          )}

          {/* =========================
              INDEX ERROR
             ========================= */}

          {indexError && (
            <p className="repository-index-error">
              {indexError}
            </p>
          )}

          {/* =========================
              BACKEND ERROR
             ========================= */}

          {repository.errorMessage && (
            <p className="repository-index-error">
              {repository.errorMessage}
            </p>
          )}

        </div>
      </section>
    </AppLayout>
  );
}

export default RepositoryDetails;
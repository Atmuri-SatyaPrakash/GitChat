import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

import {
  getChatSessions,
  getRepositories,
  deleteChatSession,
} from "../services/api";

function Chats() {
  const navigate = useNavigate();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedChats, setSelectedChats] =
    useState([]);

  const [deletingId, setDeletingId] =
    useState(null);

  const [deletingSelected, setDeletingSelected] =
    useState(false);

  useEffect(() => {
    async function loadChats() {
      try {
        setLoading(true);
        setError("");

        const repositoryData =
          await getRepositories();

        const sessionResults =
          await Promise.all(
            repositoryData.map(
              async (repository) => {
                try {
                  const sessions =
                    await getChatSessions(
                      repository.id
                    );

                  return sessions.map(
                    (session) => ({
                      ...session,
                      repositoryName:
                        repository.name,
                      repositoryFullName:
                        repository.fullName,
                    })
                  );
                } catch (error) {
                  console.error(
                    `Unable to load chats for ${repository.name}:`,
                    error
                  );

                  return [];
                }
              }
            )
          );

        const allChats =
          sessionResults
            .flat()
            .sort(
              (a, b) =>
                new Date(b.createdAt) -
                new Date(a.createdAt)
            );

        setChats(allChats);
      } catch (error) {
        console.error(
          "Unable to load chats:",
          error
        );

        setError(
          error.message ||
            "Unable to load your chats."
        );
      } finally {
        setLoading(false);
      }
    }

    loadChats();
  }, []);

  function openChat(chat) {
    navigate(
      `/repositories/${chat.repositoryId}/chat?session=${chat.id}`
    );
  }

  function toggleChatSelection(
    event,
    chatId
  ) {
    event.stopPropagation();

    setSelectedChats((current) => {
      if (current.includes(chatId)) {
        return current.filter(
          (id) => id !== chatId
        );
      }

      return [...current, chatId];
    });
  }

  function toggleSelectAll() {
    if (
      selectedChats.length ===
      chats.length
    ) {
      setSelectedChats([]);
      return;
    }

    setSelectedChats(
      chats.map((chat) => chat.id)
    );
  }

  async function handleDeleteChat(
    event,
    chatId
  ) {
    event.stopPropagation();

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this chat?"
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(chatId);
      setError("");

      await deleteChatSession(chatId);

      setChats((current) =>
        current.filter(
          (chat) => chat.id !== chatId
        )
      );

      setSelectedChats((current) =>
        current.filter(
          (id) => id !== chatId
        )
      );
    } catch (error) {
      console.error(
        "Unable to delete chat:",
        error
      );

      setError(
        error.message ||
          "Unable to delete chat."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function handleDeleteSelected() {
    if (selectedChats.length === 0) {
      return;
    }

    const confirmed =
      window.confirm(
        `Are you sure you want to delete ${selectedChats.length} selected chat${
          selectedChats.length > 1
            ? "s"
            : ""
        }?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setDeletingSelected(true);
      setError("");

      /*
       * Delete all selected chats.
       */
      await Promise.all(
        selectedChats.map((chatId) =>
          deleteChatSession(chatId)
        )
      );

      /*
       * Remove them from the UI.
       */
      setChats((current) =>
        current.filter(
          (chat) =>
            !selectedChats.includes(
              chat.id
            )
        )
      );

      setSelectedChats([]);
    } catch (error) {
      console.error(
        "Unable to delete selected chats:",
        error
      );

      setError(
        error.message ||
          "Unable to delete selected chats."
      );
    } finally {
      setDeletingSelected(false);
    }
  }

  function formatDate(dateValue) {
    if (!dateValue) {
      return "";
    }

    const date =
      new Date(dateValue);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "";
    }

    return date.toLocaleString([], {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const allSelected =
    chats.length > 0 &&
    selectedChats.length ===
      chats.length;

  const someSelected =
    selectedChats.length > 0;

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1>Chats</h1>

          <p>
            Your conversations with
            GitChat AI.
          </p>
        </div>
      </div>

      {loading && (
        <div className="chat-history-state">
          <p>
            Loading your chats...
          </p>
        </div>
      )}

      {!loading && error && (
        <div className="chat-history-state">
          <p>{error}</p>
        </div>
      )}

      {!loading &&
        !error &&
        chats.length === 0 && (
          <div className="chat-history-empty">
            <h2>No chats yet</h2>

            <p>
              Open an indexed repository
              and start a conversation
              with GitChat AI.
            </p>

            <button
              className="button primary"
              onClick={() =>
                navigate(
                  "/repositories"
                )
              }
            >
              Browse repositories
            </button>
          </div>
        )}

      {!loading &&
        !error &&
        chats.length > 0 && (
          <>
            <div className="chat-history-toolbar">
              <label className="chat-select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={
                    toggleSelectAll
                  }
                />

                <span>
                  Select All
                </span>
              </label>

              {someSelected && (
                <button
                  type="button"
                  className="button danger"
                  onClick={
                    handleDeleteSelected
                  }
                  disabled={
                    deletingSelected
                  }
                >
                  {deletingSelected
                    ? "Deleting..."
                    : `Delete Selected (${selectedChats.length})`}
                </button>
              )}
            </div>

            <section className="chat-history-list">
              {chats.map((chat) => {
                const isSelected =
                  selectedChats.includes(
                    chat.id
                  );

                return (
                  <div
                    key={chat.id}
                    className={`chat-history-item ${
                      isSelected
                        ? "chat-history-item-selected"
                        : ""
                    }`}
                    onClick={() =>
                      openChat(chat)
                    }
                    role="button"
                    tabIndex={0}
                    onKeyDown={(
                      event
                    ) => {
                      if (
                        event.key ===
                          "Enter" ||
                        event.key ===
                          " "
                      ) {
                        openChat(chat);
                      }
                    }}
                  >
                    <div className="chat-history-select">
                      <input
                        type="checkbox"
                        checked={
                          isSelected
                        }
                        onChange={(
                          event
                        ) =>
                          toggleChatSelection(
                            event,
                            chat.id
                          )
                        }
                        onClick={(event) =>
                          event.stopPropagation()
                        }
                      />
                    </div>

                    <div className="chat-history-main">
                      <strong>
                        {chat.title ||
                          `Chat with ${chat.repositoryName}`}
                      </strong>

                      <span>
                        {chat.repositoryFullName ||
                          chat.repositoryName}
                      </span>
                    </div>

                    <div className="chat-history-meta">
                      <span>
                        {formatDate(
                          chat.createdAt
                        )}
                      </span>

                      <button
                        type="button"
                        className="button danger"
                        onClick={(
                          event
                        ) =>
                          handleDeleteChat(
                            event,
                            chat.id
                          )
                        }
                        disabled={
                          deletingId ===
                          chat.id ||
                          deletingSelected
                        }
                      >
                        {deletingId ===
                        chat.id
                          ? "Deleting..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </section>
          </>
        )}
    </AppLayout>
  );
}

export default Chats;
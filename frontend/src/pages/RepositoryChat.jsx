import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";

import AppLayout from "../components/layout/AppLayout";

import {
  createChatSession,
  getChatMessages,
  getRepository,
  sendChatMessage,
} from "../services/api";

function RepositoryChat() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const existingSessionId = searchParams.get("session");

  const [repository, setRepository] = useState(null);
  const [sessionId, setSessionId] = useState(existingSessionId);
  const [messages, setMessages] = useState([]);

  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function initializeChat() {
      try {
        setLoading(true);
        setError("");

        const repo = await getRepository(id);

        setRepository(repo);

        if (repo.indexStatus !== "READY") {
          setError(
            "This repository must be indexed before you can chat with it."
          );
          return;
        }

        /*
         * If a session was provided in the URL,
         * load that existing conversation.
         */
        if (existingSessionId) {
          setSessionId(existingSessionId);

          const previousMessages =
            await getChatMessages(existingSessionId);

          setMessages(previousMessages || []);
          return;
        }

        /*
         * Otherwise create a new chat session.
         */
        const session = await createChatSession(id);

        setSessionId(session.id);

        /*
         * Update the URL so refreshing the page
         * keeps the same chat session.
         */
        navigate(
          `/repositories/${id}/chat?session=${session.id}`,
          { replace: true }
        );
      } catch (error) {
        console.error(
          "Unable to initialize chat:",
          error
        );

        setError(
          error.message ||
            "Unable to initialize repository chat."
        );
      } finally {
        setLoading(false);
      }
    }

    initializeChat();
  }, [id, existingSessionId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  async function handleSendMessage(event) {
    event.preventDefault();

    const content = message.trim();

    if (!content || !sessionId || sending) {
      return;
    }

    setMessage("");
    setSending(true);
    setError("");

    const userMessage = {
      id: `user-${Date.now()}`,
      role: "USER",
      content,
      citations: [],
    };

    const assistantId = `assistant-${Date.now()}`;

    const assistantMessage = {
      id: assistantId,
      role: "ASSISTANT",
      content: "",
      citations: [],
    };

    setMessages((current) => [
      ...current,
      userMessage,
      assistantMessage,
    ]);

    try {
      await sendChatMessage(
        sessionId,
        content,
        {
          onUserMessage: (savedMessage) => {
            setMessages((current) =>
              current.map((item) =>
                item.id === userMessage.id
                  ? {
                      ...savedMessage,
                    }
                  : item
              )
            );
          },

          onToken: (token) => {
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId
                  ? {
                      ...item,
                      content:
                        item.content + token,
                    }
                  : item
              )
            );
          },

          onAssistantMessage: (assistant) => {
            setMessages((current) =>
              current.map((item) =>
                item.id === assistantId
                  ? {
                      ...item,
                      id: assistant.id,
                      content: assistant.content,
                      citations:
                        assistant.citations || [],
                    }
                  : item
              )
            );
          },

          onDone: () => {
            setSending(false);
          },

          onError: (error) => {
            console.error(
              "Chat error:",
              error
            );

            setError(
              error.message ||
                "Unable to generate an answer."
            );

            setSending(false);
          },
        }
      );
    } catch (error) {
      console.error(
        "Unable to send message:",
        error
      );

      setError(
        error.message ||
          "Unable to send message."
      );

      setSending(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="page-header">
          <div>
            <h1>Loading chat...</h1>

            <p>
              Preparing your repository AI
              assistant.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!repository || error) {
    return (
      <AppLayout>
        <div className="page-header">
          <div>
            <h1>Repository AI</h1>

            <p>
              {error ||
                "Unable to load repository."}
            </p>
          </div>

          <button
            className="button secondary"
            onClick={() =>
              navigate(`/repositories/${id}`)
            }
          >
            Back to repository
          </button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1>
            Chat with {repository.name}
          </h1>

          <p>
            Ask questions about your
            repository code.
          </p>
        </div>

        <button
          className="button secondary"
          onClick={() =>
            navigate(`/repositories/${id}`)
          }
        >
          Back to repository
        </button>
      </div>

      <section className="repository-chat-card">
        <div className="repository-chat-messages">
          {messages.length === 0 && (
            <div className="repository-chat-empty">
              <h2>Ask about your code</h2>

              <p>Try asking:</p>

              <ul>
                <li>
                  How does authentication
                  work?
                </li>

                <li>
                  Where is the GitHub API
                  called?
                </li>

                <li>
                  Explain the repository
                  architecture.
                </li>
              </ul>
            </div>
          )}

          {messages.map((item) => (
            <div
              key={item.id}
              className={`chat-message ${
                item.role === "USER"
                  ? "chat-message-user"
                  : "chat-message-assistant"
              }`}
            >
              <div className="chat-message-role">
                {item.role === "USER"
                  ? "You"
                  : "GitChat AI"}
              </div>

              <div className="chat-message-content">
                {item.role === "ASSISTANT" ? (
                  <ReactMarkdown
                    components={{
                      code({
                        inline,
                        className,
                        children,
                        ...props
                      }) {
                        return inline ? (
                          <code
                            className={className}
                            {...props}
                          >
                            {children}
                          </code>
                        ) : (
                          <pre>
                            <code
                              className={className}
                              {...props}
                            >
                              {children}
                            </code>
                          </pre>
                        );
                      },
                    }}
                  >
                    {item.content || ""}
                  </ReactMarkdown>
                ) : (
                  <p>{item.content}</p>
                )}
              </div>

              {item.citations?.length > 0 && (
                <div className="chat-citations">
                  <strong>Sources</strong>

                  {item.citations.map(
                    (citation, index) => (
                      <div
                        key={`${citation.filePath}-${index}`}
                        className="chat-citation"
                      >
                        {citation.filePath}

                        {citation.startLine != null &&
                          citation.endLine != null && (
                            <span>
                              {" "}
                              (lines{" "}
                              {citation.startLine}
                              -
                              {citation.endLine})
                            </span>
                          )}
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {error && (
          <p className="repository-index-error">
            {error}
          </p>
        )}

        <form
          className="repository-chat-input"
          onSubmit={handleSendMessage}
        >
          <textarea
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            placeholder="Ask about this repository..."
            rows={3}
            disabled={sending}
          />

          <button
            className="button primary"
            type="submit"
            disabled={
              sending ||
              !message.trim() ||
              !sessionId
            }
          >
            {sending ? "Thinking..." : "Send"}
          </button>
        </form>
      </section>
    </AppLayout>
  );
}

export default RepositoryChat;
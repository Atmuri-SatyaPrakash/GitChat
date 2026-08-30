const API_BASE_URL = "https://gitchat-backend-eeyo.onrender.com";

export async function getCurrentUser() {
  const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Failed to fetch current user");
  }

  return response.json();
}

export async function getLoginUrl() {
  const response = await fetch(`${API_BASE_URL}/api/auth/login-url`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error("Failed to get GitHub login URL");
  }

  return response.json();
}

export async function getRepositories() {
  const response = await fetch(`${API_BASE_URL}/api/repos`, {
    credentials: "include",
  });

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch repositories");
  }

  return response.json();
}

export async function getRepository(id) {
  const response = await fetch(`${API_BASE_URL}/api/repos/${id}`, {
    credentials: "include",
  });

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (response.status === 404) {
    throw new Error("Repository not found");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch repository");
  }

  return response.json();
}

export async function indexRepository(id) {
  const response = await fetch(
    `${API_BASE_URL}/api/repos/${id}/index`,
    {
      method: "POST",
      credentials: "include",
    }
  );

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (response.status === 404) {
    throw new Error("Repository not found");
  }

  if (!response.ok) {
    throw new Error("Failed to start repository indexing");
  }

  return response.json();
}

/* =========================
   Chat API
   ========================= */

export async function createChatSession(repositoryId, title) {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        repositoryId,
        title,
      }),
    }
  );

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (response.status === 400) {
    const message = await response.text();
    throw new Error(message || "Repository is not ready for chat");
  }

  if (!response.ok) {
    throw new Error("Failed to create chat session");
  }

  return response.json();
}

export async function getChatSessions(repositoryId) {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions?repositoryId=${encodeURIComponent(
      repositoryId
    )}`,
    {
      credentials: "include",
    }
  );

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch chat sessions");
  }

  return response.json();
}

export async function getChatMessages(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
    {
      credentials: "include",
    }
  );

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (response.status === 404) {
    throw new Error("Chat session not found");
  }

  if (!response.ok) {
    throw new Error("Failed to fetch chat messages");
  }

  return response.json();
}

/*
 * Sends a chat message and reads the SSE response.
 *
 * Events produced by ChatStreamHandler:
 *
 * user_message
 * token
 * assistant_message
 * done
 */
export async function sendChatMessage(
  sessionId,
  content,
  handlers = {}
) {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}/messages`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        content,
      }),
    }
  );

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (response.status === 404) {
    throw new Error("Chat session not found");
  }

  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      message || "Failed to send chat message"
    );
  }

  if (!response.body) {
    throw new Error("Streaming response is not supported");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    buffer += decoder.decode(value, {
      stream: true,
    });

    const events = buffer.split("\n\n");

    buffer = events.pop() || "";

    for (const eventBlock of events) {
      processSseEvent(eventBlock, handlers);
    }
  }

  if (buffer.trim()) {
    processSseEvent(buffer, handlers);
  }

  if (handlers.onDone) {
    handlers.onDone();
  }
}

function processSseEvent(eventBlock, handlers) {
  if (!eventBlock.trim()) {
    return;
  }

  const lines = eventBlock.split(/\r?\n/);

  let eventName = "message";
  const dataLines = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.substring(6).trim();
    }

    if (line.startsWith("data:")) {
      dataLines.push(
        line.substring(5).trimStart()
      );
    }
  }

  const data = dataLines.join("\n");

  if (eventName === "user_message") {
    const message = parseSseData(data);

    if (handlers.onUserMessage && message) {
      handlers.onUserMessage(message);
    }

    return;
  }

  if (eventName === "token") {
    const token = parseSseData(data);

    if (handlers.onToken) {
      handlers.onToken(
        typeof token === "string"
          ? token
          : String(token ?? "")
      );
    }

    return;
  }

  if (eventName === "assistant_message") {
    const message = parseSseData(data);

    if (handlers.onAssistantMessage && message) {
      handlers.onAssistantMessage(message);
    }

    return;
  }

  if (eventName === "done") {
    if (handlers.onDone) {
      handlers.onDone();
    }
  }
}

function parseSseData(data) {
  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
}
export async function deleteChatSession(sessionId) {
  const response = await fetch(
    `${API_BASE_URL}/api/chat/sessions/${sessionId}`,
    {
      method: "DELETE",
      credentials: "include",
    }
  );

  if (response.status === 401) {
    throw new Error("Not authenticated");
  }

  if (response.status === 404) {
    throw new Error("Chat session not found");
  }

  if (!response.ok) {
    const message = await response.text();

    throw new Error(
      message || "Failed to delete chat"
    );
  }
}
export async function logout() {
  const response = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!response.ok && response.status !== 204) {
    throw new Error("Failed to logout");
  }
}
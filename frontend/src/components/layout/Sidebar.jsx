import {
  Home,
  FolderGit2,
  MessageSquare,
} from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function Sidebar() {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  };

  const githubProfileUrl = user
    ? `https://github.com/${user.githubUsername}`
    : "#";

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">
          <span className="brand-hexagon">
            <span className="brand-code">&lt;/&gt;</span>
          </span>
        </div>

        <span>GitChat</span>
      </div>

      <nav className="navigation">
        <a
          href="/"
          className={`navigation-item ${
            isActive("/") ? "active" : ""
          }`}
        >
          <Home size={18} />
          <span>Dashboard</span>
        </a>

        <a
          href="/repositories"
          className={`navigation-item ${
            isActive("/repositories") ? "active" : ""
          }`}
        >
          <FolderGit2 size={18} />
          <span>My repositories</span>
        </a>

        <a
          href="/chats"
          className={`navigation-item ${
            isActive("/chats") ? "active" : ""
          }`}
        >
          <MessageSquare size={18} />
          <span>Chats</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          {loading ? (
            <>
              <div className="user-avatar">...</div>

              <div className="user-details">
                <strong>Loading...</strong>
                <span>Please wait</span>
              </div>
            </>
          ) : user ? (
            <a
              href={githubProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="sidebar-profile-link"
              title="Open GitHub profile"
            >
              <img
                className="user-avatar user-photo"
                src={user.avatarUrl}
                alt={user.githubUsername}
              />

              <div className="user-details">
                <strong>{user.displayName}</strong>
                <span>@{user.githubUsername}</span>
              </div>
            </a>
          ) : (
            <>
              <div className="user-avatar">?</div>

              <div className="user-details">
                <strong>Not connected</strong>
                <span>Connect GitHub</span>
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;
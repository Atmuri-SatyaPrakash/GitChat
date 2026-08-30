import { Bell, LogOut } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import ThemeToggle from "./ThemeToggle";
import { logout } from "../../services/api";

function Header() {
  const { user } = useAuth();

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      window.location.href = "/";
    }
  }

  const githubProfileUrl = user
    ? `https://github.com/${user.githubUsername}`
    : "#";

  return (
    <header className="top-header">
      <div className="header-title">
        <span>Dashboard</span>
      </div>

      <div className="header-actions">
        <ThemeToggle />

        <button className="icon-button" title="Notifications">
          <Bell size={18} />
        </button>

        {user && (
          <>
            <a
              href={githubProfileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="profile-button"
              title="Open GitHub profile"
            >
              <img
                className="user-avatar small user-photo"
                src={user.avatarUrl}
                alt={user.githubUsername}
              />

              <span>{user.githubUsername}</span>
            </a>

            <button
              className="button secondary"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={16} />
              Logout
            </button>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
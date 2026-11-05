
import { useState } from "react";
import {
  NavLink,
  Outlet,
  useLocation
} from "react-router-dom";

import {
  Home,
  Trophy,
  MessageCircle,
  ChevronDown,
  UserRound,
  Medal,
  ReceiptText,
  ClipboardList,
  MoreHorizontal,
  X,
  LogOut
} from "lucide-react";

import { useAuth } from "../app/AuthContext";

const primaryLinks = [
  { label: "Home", path: "/", icon: Home },
  { label: "Tournaments", path: "/tournaments", icon: Trophy },
  { label: "Chats", path: "/chats", icon: MessageCircle }
];

const moreLinks = [
  { label: "Profile", path: "/profile", icon: UserRound },
  { label: "Leaderboards", path: "/leaderboards", icon: Medal },
  { label: "Transaction History", path: "/transactions", icon: ReceiptText },
  { label: "Registrations", path: "/registrations", icon: ClipboardList }
];

function PlayerShell() {
  const location = useLocation();

  const isProfileRoute = location.pathname === "/profile";
  
  const { accessLevel, username, signOut } = useAuth();

  const [moreOpen, setMoreOpen] = useState(false);

  const profileOnly = accessLevel === "profile_only";

  const visiblePrimaryLinks = profileOnly
    ? [moreLinks[0]]
    : primaryLinks;

  const visibleMoreLinks = profileOnly ? [] : moreLinks;

  const morePaths = visibleMoreLinks.map((item) => item.path);

  const isMoreRoute = morePaths.includes(location.pathname);

  const showMore = !profileOnly && (moreOpen || isMoreRoute);

  const closeMore = () => setMoreOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <div className={`app-shell ${profileOnly ? "profile-only-shell" : ""}`}>
      <aside className="desktop-sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Trophy size={22} />
          </div>

          <div>
            <strong>KICKOFF</strong>
            <span>PLAYER ARENA</span>
          </div>
        </div>

        <nav className="sidebar-navigation">
          <p className="nav-section-label">
            {profileOnly ? "ACCOUNT" : "MAIN MENU"}
          </p>

          {visiblePrimaryLinks.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/"}
                className={linkClass}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}

          {!profileOnly && (
            <div className="more-section">
              <button
                type="button"
                className={`nav-link more-toggle ${
                  isMoreRoute ? "active" : ""
                }`}
                onClick={() => setMoreOpen(!moreOpen)}
                aria-expanded={showMore}
              >
                <MoreHorizontal size={19} />
                <span>More</span>

                <ChevronDown
                  size={17}
                  className={`chevron ${showMore ? "rotated" : ""}`}
                />
              </button>

              {showMore && (
                <div className="more-links">
                  {visibleMoreLinks.map((item) => {
                    const Icon = item.icon;

                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={linkClass}
                      >
                        <Icon size={18} />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator" />
            <span className="sidebar-username" title={username ?? undefined}>
              {username ?? "PLAYER"}
            </span>
        </div>
      </aside>

      <div
        className={`main-area ${
          isProfileRoute ? "profile-main-area" : ""
        }`}
      >
        <header className="app-header">
          <div className="mobile-brand">
            <div className="brand-mark">
              <Trophy size={19} />
            </div>

            <strong>KICKOFF</strong>
          </div>

          <div className="header-right">
            {profileOnly && (
              <span className="restricted-label">
                PROFILE ONLY
              </span>
            )}

            <NavLink
              to="/profile"
              className="profile-shortcut"
              aria-label="Open profile"
            >
              <UserRound size={19} />
            </NavLink>

            <button
              type="button"
              className="logout-button"
              onClick={() => void signOut()}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {profileOnly && (
          <div className="restricted-notice">
            Your player account is not active. Only your profile is
            available.
          </div>
        )}

        <main
          className={`page-content ${
            isProfileRoute ? "profile-page-content" : ""
          }`}
        >
          <Outlet />
        </main>
      </div>

      {!profileOnly && moreOpen && (
        <div className="mobile-more-panel">
          <div className="more-panel-header">
            <strong>MORE</strong>

            <button
              type="button"
              onClick={closeMore}
              aria-label="Close more navigation"
            >
              <X size={19} />
            </button>
          </div>

          {visibleMoreLinks.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={linkClass}
                onClick={closeMore}
              >
                <Icon size={19} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      )}

      <nav
        className={`mobile-bottom-navigation ${
          profileOnly ? "restricted-bottom-navigation" : ""
        }`}
      >
        {visiblePrimaryLinks.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={linkClass}
              onClick={closeMore}
            >
              <Icon size={21} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {!profileOnly && (
          <button
            type="button"
            className={`nav-link more-mobile-button ${
              showMore ? "active" : ""
            }`}
            onClick={() => setMoreOpen(!moreOpen)}
            aria-expanded={moreOpen}
          >
            <MoreHorizontal size={21} />
            <span>More</span>
          </button>
        )}
      </nav>
    </div>
  );
}

export default PlayerShell;

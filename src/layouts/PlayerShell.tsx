

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
  X
} from "lucide-react";

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

  const [moreOpen, setMoreOpen] = useState(false);

  const morePaths = moreLinks.map((item) => item.path);

  const isMoreRoute = morePaths.includes(location.pathname);

  const showMore = moreOpen || isMoreRoute;

  const closeMore = () => setMoreOpen(false);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `nav-link ${isActive ? "active" : ""}`;

  return (
    <div className="app-shell">

      {/* Desktop sidebar */}
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

          <p className="nav-section-label">MAIN MENU</p>

          {primaryLinks.map((item) => {
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
                {moreLinks.map((item) => {
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
        </nav>

        <div className="sidebar-footer">
          <div className="status-indicator" />
          <span>PLAYER PORTAL</span>
        </div>
      </aside>

      {/* Main application */}
      <div className="main-area">

        <header className="app-header">

          <div className="mobile-brand">
            <div className="brand-mark">
              <Trophy size={19} />
            </div>

            <strong>KICKOFF</strong>
          </div>

          <div className="header-right">
            <span className="header-label">PLAYER ARENA</span>

            <NavLink
              to="/profile"
              className="profile-shortcut"
              aria-label="Open profile"
            >
              <UserRound size={19} />
            </NavLink>
          </div>

        </header>

        <main className="page-content">
          <Outlet />
        </main>

      </div>

      {/* Mobile More navigation panel */}
      {moreOpen && (
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

          {moreLinks.map((item) => {
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

      {/* Mobile bottom navigation */}
      <nav className="mobile-bottom-navigation">

        {primaryLinks.map((item) => {
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

      </nav>

    </div>
  );
}

export default PlayerShell;

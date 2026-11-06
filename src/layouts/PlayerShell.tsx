
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

import {
  ChatNotificationsProvider,
  useChatNotifications
} from "../hooks/chat/ChatNotificationsContext";


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

function PlayerShellContent() {
  const location = useLocation();
  
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
  
  const { unreadCount } = useChatNotifications();

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
            <strong>KICKOFF DLS</strong>
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
                
              <span className="relative inline-flex">
                <Icon size={19} />
              
                {item.path === "/chats" && unreadCount > 0 && (
                  <span
                    className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
                    aria-label={`${unreadCount} unread messages`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              
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

      <div className="main-area">
        <header className="app-header">
          <div className="mobile-brand">
            <div className="brand-mark">
              <Trophy size={19} />
            </div>

            <strong>KICKOFF DLS</strong>
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

        <main className="page-content">
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

            <span className="relative inline-flex">
              <Icon size={21} />
            
              {item.path === "/chats" && unreadCount > 0 && (
                <span
                  className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
                  aria-label={`${unreadCount} unread messages`}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            
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


function PlayerShell() {
  const { identity } = useAuth();

  return (
    <ChatNotificationsProvider
      playerId={identity?.player_id ?? null}
    >
      <PlayerShellContent />
    </ChatNotificationsProvider>
  );
}

export default PlayerShell;


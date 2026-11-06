import { BrowserRouter, Routes, Route } from "react-router-dom";

import PlayerShell from "../layouts/PlayerShell";
import PlaceholderPage from "../pages/PlaceholderPage";

import ProfilePage from "../pages/profile/ProfilePage";

import RegisterPage from "../pages/RegisterPage";
import LoginPage from "../pages/LoginPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ProtectedRoute from "../components/ProtectedRoutes";

import ChatsPage from "../pages/chat/ChatsPage";
import ConversationPage from "../pages/chat/ConversationPage";

import TournamentsPage from "../pages/tournament/TournamentsPage";
import TournamentDirectoryPage from "../pages/tournament/TournamentDirectoryPage";

import RegistrationsPage from "../pages/registration/RegistrationsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />

        <Route
          element={
            <ProtectedRoute>
              <PlayerShell />
            </ProtectedRoute>
          }
        >
          <Route
            index
            element={<PlaceholderPage title="Home" />}
          />

          <Route
            path="tournaments"
            element={<TournamentsPage />}
          />

          <Route
            path="tournaments/all"
            element={<TournamentDirectoryPage />}
          />

          <Route
            path="tournaments/type/:typeId"
            element={<TournamentDirectoryPage />}
          />

          <Route
            path="tournaments/register/:tournamentId"
            element={<PlaceholderPage title="Registration Request" />}
          />

          <Route
            path="chats"
            element={<ChatsPage />}
          />

          <Route
            path="chats/:conversationId"
            element={<ConversationPage />}
          />

          <Route
            path="profile"
            element={<ProfilePage />}
          />

          <Route
            path="leaderboards"
            element={<PlaceholderPage title="Leaderboards" />}
          />

          <Route
            path="transactions"
            element={<PlaceholderPage title="Transaction History" />}
          />

          <Route
            path="registrations"
            element={<RegistrationsPage />}
          />

          <Route
            path="*"
            element={<PlaceholderPage title="Page Not Found" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

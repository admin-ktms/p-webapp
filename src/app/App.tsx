

import { BrowserRouter, Routes, Route } from "react-router-dom";

import PlayerShell from "./layouts/PlayerShell";
import PlaceholderPage from "./components/PlaceholderPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PlayerShell />}>
          <Route
            index
            element={<PlaceholderPage title="Home" />}
          />

          <Route
            path="tournaments"
            element={<PlaceholderPage title="Tournaments" />}
          />

          <Route
            path="chats"
            element={<PlaceholderPage title="Chats" />}
          />

          <Route
            path="profile"
            element={<PlaceholderPage title="Profile" />}
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
            element={<PlaceholderPage title="Registrations" />}
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

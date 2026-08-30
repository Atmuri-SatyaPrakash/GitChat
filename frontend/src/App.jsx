import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Repositories from "./pages/Repositories";
import RepositoryDetails from "./pages/RepositoryDetails";
import RepositoryChat from "./pages/RepositoryChat";
import Chats from "./pages/Chats";
import AuthCallback from "./pages/AuthCallback";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/repositories"
          element={<Repositories />}
        />

        <Route
          path="/repositories/:id"
          element={<RepositoryDetails />}
        />

        <Route
          path="/repositories/:id/chat"
          element={<RepositoryChat />}
        />

        <Route
          path="/chats"
          element={<Chats />}
        />

        <Route
          path="/auth/callback"
          element={<AuthCallback />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
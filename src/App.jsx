import { useEffect, useState } from "react";
import { fetchHealth } from "./api/health";
import "./App.css";

// Temporary start page: shows whether the EMS backend and its database are
// reachable through GET /api/health. The real EMS screens come in task T8.
function App() {
  const [state, setState] = useState({ status: "loading" });

  useEffect(() => {
    // Cancel the request if the page unmounts (React StrictMode mounts twice in development).
    const controller = new AbortController();

    fetchHealth(controller.signal)
      .then((health) => {
        setState({ status: "ok", health: health });
      })
      .catch((error) => {
        if (error.name === "AbortError") {
          return;
        }
        setState({ status: "error", message: error.message });
      });

    return () => controller.abort();
  }, []);

  let text = "Checking the backend...";
  if (state.status === "ok") {
    text = "Backend is running. Database: " + state.health.database + ".";
  } else if (state.status === "error") {
    text = "Backend problem: " + state.message;
  }

  return (
    <div>
      <h1>Employee Management System</h1>
      <p role="status">{text}</p>
    </div>
  );
}

export default App;


import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("Connecting to backend...");

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((response) => response.json())
      .then((data) => {
        setMessage(data.message);
      })
      .catch((error) => {
        console.log(error);
        setMessage("Backend connection failed");
      });
  }, []);

  return (
    <div>
      <h1>Employee Management System</h1>
      <p>{message}</p>
    </div>
  );
}

export default App;

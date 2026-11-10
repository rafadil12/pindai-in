import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ReceiverPage } from "./pages/ReceiverPage";
import { SenderPage } from "./pages/SenderPage";
import "./styles.css";

function App() {
  const match = window.location.pathname.match(/^\/k\/([A-Za-z0-9]{6})\/?$/);
  if (match) return <SenderPage code={match[1].toUpperCase()} />;
  return <ReceiverPage />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

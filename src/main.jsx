import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

function Root() {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const rerender = () => forceRender((value) => value + 1);
    window.addEventListener("popstate", rerender);
    return () => window.removeEventListener("popstate", rerender);
  }, []);

  return <App />;
}

createRoot(document.getElementById("root")).render(<Root />);


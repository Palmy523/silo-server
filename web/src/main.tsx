import { createRoot } from "react-dom/client";
import App from "./App";
import { bootSigil } from "./lib/sigil/boot";
import { installPreloadErrorReload } from "./lib/reloadOnPreloadError";
import "./app.css";

bootSigil();
installPreloadErrorReload();

const root = document.getElementById("root");
if (root === null) throw new Error("Root element #root not found");
createRoot(root).render(<App />);

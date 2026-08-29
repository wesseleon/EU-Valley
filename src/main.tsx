import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "react-flagpack/dist/style.css";
import "@hackernoon/pixel-icon-library/fonts/iconfont.css";

createRoot(document.getElementById("root")!).render(<App />);

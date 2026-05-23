import { jsx } from "react/jsx-runtime";
import { createRoot } from "react-dom/client";
import App from "./App";
import AppErrorBoundary from "./components/AppErrorBoundary";
import "./index.css";
createRoot(document.getElementById("root")).render(
  /* @__PURE__ */ jsx(AppErrorBoundary, {
    children: /* @__PURE__ */ jsx(App, {}),
  }),
);

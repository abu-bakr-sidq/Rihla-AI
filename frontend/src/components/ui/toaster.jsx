import { jsx, jsxs } from "react/jsx-runtime";
import { useToast } from "@/hooks/use-toast";
import { sanitizeRenderText } from "@/lib/display-text";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastIcon,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from "@/components/ui/toast";
function Toaster() {
  const { toasts } = useToast();
  return /* @__PURE__ */ jsxs(ToastProvider, { children: [
    toasts.map(function({ id, title, description, action, ...props }) {
      const safeTitle = sanitizeRenderText(title);
      const safeDescription = sanitizeRenderText(description);
      const variant = props.variant || "default";
      return /* @__PURE__ */ jsxs(Toast, { ...props, children: [
        /* @__PURE__ */ jsx(ToastIcon, { variant }),
        /* @__PURE__ */ jsxs("div", { className: "grid flex-1 gap-1 pr-4", children: [
          safeTitle && /* @__PURE__ */ jsx(ToastTitle, { children: safeTitle }),
          safeDescription && /* @__PURE__ */ jsx(ToastDescription, { children: safeDescription })
        ] }),
        action,
        /* @__PURE__ */ jsx(ToastClose, {})
      ] }, id);
    }),
    /* @__PURE__ */ jsx(ToastViewport, {})
  ] });
}
export {
  Toaster
};

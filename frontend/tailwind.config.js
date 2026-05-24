import rootConfig from "../tailwind.config.js";

export default {
  ...rootConfig,
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
};

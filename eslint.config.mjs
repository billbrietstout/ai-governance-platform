import nextConfig from "eslint-config-next";
import reactHooksPlugin from "eslint-plugin-react-hooks";

const config = [
  ...nextConfig,
  { ignores: [".next/", "node_modules/", "prisma/migrations/"] },
  {
    plugins: { "react-hooks": reactHooksPlugin },
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn"
    }
  }
];

export default config;

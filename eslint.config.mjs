import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // Avatares vêm de uploads do usuário em hosts dinâmicos. O componente
      // Image exige uma allowlist estática e não é adequado para esse caso.
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["scripts/**/*.cjs"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  globalIgnores([
    ".next/**",
    "coverage/**",
    "build/**",
    "out/**",
    "next-env.d.ts",
  ]),
]);

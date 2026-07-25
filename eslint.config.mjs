import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // CLAUDE.md: "No `any`, no `@ts-ignore`." Enforced, not just documented.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": true, "ts-expect-error": "allow-with-description" },
      ],
      // A leading underscore is the project's "deliberately unused" marker —
      // used by contract stubs that must keep a signature they don't yet consume
      // (e.g. lib/progress.ts until Dev C lands P8-04).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Non-app deliverables — client documents and the P0-03 design comp.
    // Not built, not imported. See orchestrate/codebase.md.
    "design/**",
    "client/**",
  ]),
]);

export default eslintConfig;

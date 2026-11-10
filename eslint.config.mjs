import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // next/core-web-vitals already registers the jsx-a11y plugin but only turns on a few rules;
  // enable its full recommended set.
  { rules: jsxA11y.flatConfigs.recommended.rules },
  // Formatting is Prettier's job: turn off any stylistic rules that would fight it.
  prettier,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/lib/database.types.ts",
    ],
  },
];

export default eslintConfig;

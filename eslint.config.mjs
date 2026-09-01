import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  // Prisma's generated client is not ours to lint - it produced ~1,890 of the
  // ~1,900 reported problems and drowned out real ones.
  // Not our code: Prisma's generated client, and the bklit chart components
  // pulled in via the shadcn registry (re-pulled on update, so edits are lost).
  { ignores: ["lib/generated/**", ".next/**", "components/charts/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;

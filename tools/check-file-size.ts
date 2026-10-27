import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/** Guardrail: no source file exceeds ~150 lines (tests are exempt). */
const LIMIT = 150;
const ROOTS = ["apps", "packages", "tools"];
const SKIP_DIRS = new Set(["node_modules", "dist", ".turbo", ".git"]);

const collect = (dir: string): string[] => {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...collect(join(dir, entry.name)));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry.name)) continue;
    if (entry.name.includes(".test.")) continue;
    files.push(join(dir, entry.name));
  }
  return files;
};

const violations: string[] = [];

for (const root of ROOTS) {
  for (const file of collect(root)) {
    const lines = readFileSync(file, "utf8").split("\n").length;
    if (lines > LIMIT) violations.push(`${file}: ${lines} lines`);
  }
}

if (violations.length > 0) {
  console.error(`Files exceed the ${LIMIT}-line guardrail limit:`);
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log(`file-size ok: all source files <= ${LIMIT} lines`);

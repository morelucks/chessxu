/**
 * add-esm-package.js
 *
 * Writes a minimal package.json into dist/esm/ that marks it as an ES module.
 * This is required so that Node.js treats the .js files in that directory as
 * ESM (import/export) rather than CommonJS.
 */

const fs = require("fs");
const path = require("path");

const esmDir = path.join(__dirname, "..", "dist", "esm");

if (!fs.existsSync(esmDir)) {
  fs.mkdirSync(esmDir, { recursive: true });
}

const pkg = { type: "module" };
fs.writeFileSync(
  path.join(esmDir, "package.json"),
  JSON.stringify(pkg, null, 2) + "\n"
);

console.log("✓ dist/esm/package.json written (type: module)");

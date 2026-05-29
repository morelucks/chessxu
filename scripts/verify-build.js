/**
 * verify-build.js
 *
 * Post-build smoke test that verifies:
 *   1. dist/cjs/index.js exists and is loadable via require()
 *   2. dist/esm/index.js exists and contains ES module syntax
 *   3. dist/cjs/index.d.ts and dist/esm/index.d.ts exist
 *   4. Key exports are present in the CJS build
 *   5. dist/esm/package.json has { "type": "module" }
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? `: ${detail}` : ""}`);
    failed++;
  }
}

console.log("\n── Verifying dual build outputs ──\n");

// 1. CJS output exists
const cjsIndex = path.join(ROOT, "dist", "cjs", "index.js");
check("dist/cjs/index.js exists", fs.existsSync(cjsIndex));

// 2. ESM output exists
const esmIndex = path.join(ROOT, "dist", "esm", "index.js");
check("dist/esm/index.js exists", fs.existsSync(esmIndex));

// 3. Type declarations exist
check(
  "dist/cjs/index.d.ts exists",
  fs.existsSync(path.join(ROOT, "dist", "cjs", "index.d.ts"))
);
check(
  "dist/esm/index.d.ts exists",
  fs.existsSync(path.join(ROOT, "dist", "esm", "index.d.ts"))
);

// 4. ESM package.json has type: module
const esmPkgPath = path.join(ROOT, "dist", "esm", "package.json");
if (fs.existsSync(esmPkgPath)) {
  const esmPkg = JSON.parse(fs.readFileSync(esmPkgPath, "utf8"));
  check('dist/esm/package.json has "type": "module"', esmPkg.type === "module");
} else {
  check("dist/esm/package.json exists", false, "file not found");
}

// 5. CJS build is loadable and exports key symbols
if (fs.existsSync(cjsIndex)) {
  try {
    const sdk = require(cjsIndex);
    check("CJS: CHESSXU_DEPLOYER exported", typeof sdk.CHESSXU_DEPLOYER === "string");
    check("CJS: CONTRACTS exported", typeof sdk.CONTRACTS === "object");
    check("CJS: ERRORS exported", typeof sdk.ERRORS === "object");
    check("CJS: GAME_STATUS exported", typeof sdk.GAME_STATUS === "object");
    check("CJS: ChessxuError exported", typeof sdk.ChessxuError === "function");
    check("CJS: parseContractId exported", typeof sdk.parseContractId === "function");
    check("CJS: formatChess exported", typeof sdk.formatChess === "function");
    check("CJS: parseChess exported", typeof sdk.parseChess === "function");
    check("CJS: isGameActive exported", typeof sdk.isGameActive === "function");
    check("CJS: isGameOver exported", typeof sdk.isGameOver === "function");
    check("CJS: getWinner exported", typeof sdk.getWinner === "function");
    check("CJS: txExplorerUrl exported", typeof sdk.txExplorerUrl === "function");
  } catch (err) {
    check("CJS: require() succeeds", false, err.message);
  }
}

// 6. ESM file contains export syntax (not require/module.exports)
if (fs.existsSync(esmIndex)) {
  const esmContent = fs.readFileSync(esmIndex, "utf8");
  check(
    "ESM: index.js uses export syntax",
    esmContent.includes("export ") || esmContent.includes("export{")
  );
  check(
    "ESM: index.js does not use module.exports",
    !esmContent.includes("module.exports")
  );
}

// 7. CJS file uses require/exports pattern
if (fs.existsSync(cjsIndex)) {
  const cjsContent = fs.readFileSync(cjsIndex, "utf8");
  check(
    "CJS: index.js uses exports pattern",
    cjsContent.includes("exports.") || cjsContent.includes("module.exports")
  );
}

console.log(`\n── Results: ${passed} passed, ${failed} failed ──\n`);

if (failed > 0) {
  process.exit(1);
}

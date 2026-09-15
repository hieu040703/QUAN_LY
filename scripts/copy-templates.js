const fs = require("node:fs");
const path = require("node:path");

const sourceDir = path.join(process.cwd(), "src", "shared", "templates");
const targetDir = path.join(process.cwd(), "dist", "shared", "templates");

if (!fs.existsSync(sourceDir)) {
  console.log("[copy-templates] Source folder does not exist, skipping.");
  process.exit(0);
}

fs.mkdirSync(targetDir, { recursive: true });

const files = fs.readdirSync(sourceDir);
for (const fileName of files) {
  const sourcePath = path.join(sourceDir, fileName);
  const targetPath = path.join(targetDir, fileName);
  const stat = fs.statSync(sourcePath);

  if (stat.isFile()) {
    fs.copyFileSync(sourcePath, targetPath);
  }
}

console.log(
  `[copy-templates] Copied ${files.length} file(s) to dist/shared/templates.`,
);
